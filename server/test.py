import base64
import shutil
import os
import time
from PIL import Image
import matplotlib.pyplot as plt
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from google.oauth2 import service_account
import google.generativeai as genai
import imgbbpy

app = FastAPI()

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Google Generative AI configuration
genai.configure(api_key="AIzaSyC5xHls3H-KrSXSDBjeExZvrzeZzrAwlkA")

# # Google Cloud project credentials
# GOOGLE_APPLICATION_CREDENTIALS = "./future-sunrise-424210-u6-545e79acda11.json"
# SCOPES = ["https://www.googleapis.com/auth/cloud-platform"]

# # Load Google service account credentials
# credentials = service_account.Credentials.from_service_account_file(
#     GOOGLE_APPLICATION_CREDENTIALS, scopes=SCOPES)


def latex_to_png(latex_code, output_path, dpi=300):
    plt.rc('text', usetex=True)
    plt.rc('text.latex', preamble=r'\usepackage{amsmath}')
    plt.rcParams['mathtext.fontset'] = 'cm'
    fig, ax = plt.subplots(figsize=(1, 0.3), dpi=dpi)
    ax.text(0.5, 0.5, latex_code, size=8, ha='left', va='center')
    ax.axis('off')
    fig.patch.set_alpha(0.0)
    plt.savefig(output_path, format='png', dpi=dpi, bbox_inches='tight', pad_inches=0.1, transparent=True)
    plt.close()


def upload_image_to_imgbb(api_key, image_path):
    client = imgbbpy.SyncClient(api_key)
    image = client.upload(file=image_path)
    return image.url


def upload_to_gemini(path, mime_type=None):
    file = genai.upload_file(path, mime_type=mime_type)
    print(f"Uploaded file '{file.display_name}' as: {file.uri}")
    return file


def wait_for_files_active(files):
    print("Waiting for file processing...")
    for name in (file.name for file in files):
        file = genai.get_file(name)
        while file.state.name == "PROCESSING":
            print(".", end="", flush=True)
            time.sleep(10)
            file = genai.get_file(name)
        if file.state.name != "ACTIVE":
            raise Exception(f"File {file.name} failed to process")
    print("...all files ready")
    print()


def get_latex_from_google_api(image_path):
    generation_config = {
        "temperature": 1,
        "top_p": 0.95,
        "top_k": 64,
        "max_output_tokens": 8192,
        "response_mime_type": "text/plain",
    }

    model = genai.GenerativeModel(
        model_name="gemini-1.5-flash",
        generation_config=generation_config,
    )

    sample_file = upload_to_gemini(image_path, mime_type="image/png")

    # Wait for the image to be processed
    wait_for_files_active([sample_file])

    response = model.generate_content([sample_file, "Generate Latex code from this image"])

    return response.text


@app.post("/render-latex/")
async def render_latex(file: UploadFile = File(...)):
    try:
        # Save the uploaded image to a temporary file
        with open("temp_image.png", "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Get LaTeX code from Google Generative AI API
        latex_code = get_latex_from_google_api("temp_image.png")

        # return latex_code

        # Render the LaTeX code to PNG
        # parser = r"$" + latex_code.strip() + r"$"
        output_path = 'rendered_image.png'
        latex_to_png(latex_code, output_path, dpi=600)

        # Upload the image to imgbb
        api_key = '5b05d85da77943ab21b76b5a6539b0b1'
        image_url = upload_image_to_imgbb(api_key, output_path)

        print(image_url)

        # Generate HTML img tag with inline CSS for size
        html_img_tag = f'<img src="{image_url}" alt="Rendered LaTeX Image" style="width: 100px; height: auto;">'

        # Clean up temporary image file
        os.remove("temp_image.png")

        return {"url": image_url}

    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))

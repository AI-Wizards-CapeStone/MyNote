from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from io import BytesIO
import torch
import torchvision.models as models
import torchvision.transforms as transforms
import io
import numpy as np
import matplotlib.pyplot as plt
import matplotlib


from PIL import Image
from src.model import LATEXX
from src.utils import trf_img

app = Flask(__name__)
CORS(app)


matplotlib.rc('text', usetex=True)


model = LATEXX()
# if torch.cuda.is_available():
#     input = input.to(torch.device('cuda'))
#     model = model.cuda()  # Move the model to GPU if available
#     print('Model moved to GPU.')


state_dict = torch.load('./src/model_epoch_49.pt', map_location=torch.device('cpu'))
model.load_state_dict(state_dict)



@app.route('/predict', methods = ['POST'])
def predict() :
    print(request.files.getlist)

    if 'image' not in request.files:
        return jsonify({'erorr' : 'No image provided'}), 400
    

    file = request.files['image']
    input = trf_img(file) 
    print(input.shape)
    input = input.to(torch.device('cpu'))

    output = model(input)
    result = ''
    for i in output :
        result+=str(i)


    return jsonify({"text": result})


if __name__ == '__main__' :
    app.run('0.0.0.0',port=5001,debug=True)
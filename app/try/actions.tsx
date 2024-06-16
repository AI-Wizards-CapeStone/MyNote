// actions.ts
export async function uploadFileServerAction(formData: FormData) {
    console.log("Uploading file...");
  
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
  
    if (!response.ok) {
      throw new Error('Failed to upload file');
    }
  
    const result = await response.json();
    return result.url;
  }
  
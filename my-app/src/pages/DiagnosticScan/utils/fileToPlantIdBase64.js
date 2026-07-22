import {convertToJpeg} from './convertToJpeg'

export async function fileToPlantIdBase64(file) {

   const jpegFile = await convertToJpeg(file, 0.8)


  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result;

      if (typeof result !== 'string') {
        reject(new Error('Invalid file result'));
        return;
      }

      resolve(result.split(',')[1]);
    };

    reader.onerror = reject;
    reader.readAsDataURL(jpegFile);
  });
}
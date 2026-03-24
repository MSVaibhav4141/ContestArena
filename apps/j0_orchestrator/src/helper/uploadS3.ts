import { PutObjectCommand, S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

  if (!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)) {
    throw Error("NO CREAD FOUND")
  }

  const client = new S3Client({
    region: "us-east-1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID ,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });


export const uploadToS3 = async (fileName:string, fileBody:any) => {
    const command = new PutObjectCommand({
    Bucket: "contest-arena-test-cases",
    Key: fileName,
    Body: JSON.stringify(fileBody),
    ContentType: "application/json"
  });

  try {
    const response = await client.send(command);
    console.log("Upload success:", response);
  } catch (err) {
    console.error("Error", err);
  }

};

export const fetchFromS3 = async(fileName:string) => {

  if (!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)) {
    throw Error("NO CREAD FOUND")
  }


  const client = new S3Client({
    region: "us-east-1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID ,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  })

      const command = new GetObjectCommand({
      Bucket: 'contest-arena-test-cases',
      Key: fileName
    });

    const result = await client.send(command)
    const data = await result.Body?.transformToString() ?? JSON.stringify([])
   
    return JSON.parse(JSON.parse(data));
}
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

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
    Body: fileBody,
    ContentType: "application/json"
  });

  try {
    const response = await client.send(command);
    console.log("Upload success:", response);
  } catch (err) {
    console.error("Error", err);
  }

};

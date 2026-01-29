import { prisma } from "@repo/db/prisma";
import fs from "fs";
import { readFile } from "fs/promises";
import { connect } from "http2";
import { join } from "path";

const files = [
  {
    langauge:'CPP',
    fileName: "function.cpp",
    code: 0,
  },
  {
    langauge:'JS',
    fileName: "function.js",
    code: 1,
  },
  {
    langauge:'RUST',
    fileName: "function.rust",
    code: 2,
  },
];

enum Difficulty {
  EASY = "EASY",
  MEDIUM = "MEDIUM",
  HARD = "HARD",
}

type Submission = {
  id: string;
  userId: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  createdAt: Date;
};

type StartCode = {
  id: string;
  language: string;
  code: string;
  createdAt: Date;
};

export type Problem = {
  title: string;
  description: string;
  slug: string;
  userId: string;
  createdBy: string;
  difficulty: Difficulty;
  pathToCode: string;
};

const addQuestion = async(payload: Problem) => {
  
}
const addQuestionForReview = async (payload: Problem) => {
  //add cecks logic

  //Storting the default code

  const defaultCode = await readFiles(payload.pathToCode);

  //Carefull for mapping
try{
 await prisma.$transaction(async (prismaTx) => {
    const problem = await prismaTx.problem.create({
    data: {
      title: payload.title,
      description: payload.description,
      slug: payload.slug,
      userId: payload.userId,
      createdBy: payload.userId,
      difficulty: payload.difficulty,
    },
  });

   await prismaTx.startCode.createMany({
  data: files.map((i, k) => ({
    problemId: problem.id,
    languageId: i.code,
    code: defaultCode[k] ?? "",
  }))
});
  })
  return true;
}catch(e){
  return false;
}
};


const readFiles = async (path: string) => {
  const contents = await Promise.all(
    files.map((i) => readFile(join(path, i.fileName), "utf-8")),
  );

  return contents;
  console.log(contents);
};

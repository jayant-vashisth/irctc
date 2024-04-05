import bcrypt from "bcrypt";

export const generateApiKey = async (): Promise<string> => {
  const apiKey = await bcrypt.hash(Math.random().toString(), 10); 
  return apiKey;
};

'use server';
import {apiAction} from '../api-rpc';
export async function sendChatMessage(...args:any[]){return apiAction('ai','sendChatMessage',args);}
export async function getChatHistory(...args:any[]){return apiAction('ai','getChatHistory',args);}
export async function getAiProviders(...args:any[]){return apiAction('ai','getAiProviders',args);}
export async function getGenerationProgress(...args:any[]){return apiAction('ai','getGenerationProgress',args);}

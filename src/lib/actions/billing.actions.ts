'use server';
import {apiAction} from '../api-rpc';
export async function requestTransactionOtp(...args:any[]){return apiAction('billing','requestTransactionOtp',args);}
export async function buyChatCredits(...args:any[]){return apiAction('billing','buyChatCredits',args);}

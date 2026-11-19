'use server';
import {apiAction} from '../api-rpc';
export async function generateLogo(...args:any[]){return apiAction('assets','generateLogo',args);}

import {requireUser} from '@/lib/auth';
import {generationBalance} from '@/lib/generation-ledger';
export const dynamic='force-dynamic';
export async function GET(){try{const user=await requireUser();return Response.json({success:true,...await generationBalance(user.id),chatCreditsPerResponse:1,purchaseUrl:'https://developer.cashpay-all.com/dev/dashboard/ai-credits'},{headers:{'Cache-Control':'private,no-store'}});}catch{return Response.json({success:false,error:'Authentication required'},{status:401,headers:{'Cache-Control':'no-store'}});}}

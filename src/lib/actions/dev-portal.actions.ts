'use server';
import {apiAction} from '../api-rpc';
export async function getJojoAiSession(...args:any[]){return apiAction('dev','getJojoAiSession',args);}
export async function getProjectsForUser(...args:any[]){return apiAction('dev','getProjectsForUser',args);}
export async function inviteCollaborator(...args:any[]){return apiAction('dev','inviteCollaborator',args);}
export async function createJojoAiProject(...args:any[]){return apiAction('dev','createJojoAiProject',args);}
export async function getProjectFileTree(...args:any[]){return apiAction('dev','getProjectFileTree',args);}
export async function getFileContent(...args:any[]){return apiAction('dev','getFileContent',args);}
export async function saveFileContent(...args:any[]){return apiAction('dev','saveFileContent',args);}
export async function getPendingActions(...args:any[]){return apiAction('dev','getPendingActions',args);}
export async function approvePendingAction(...args:any[]){return apiAction('dev','approvePendingAction',args);}
export async function approveAllPendingActions(...args:any[]){return apiAction('dev','approveAllPendingActions',args);}
export async function rejectPendingAction(...args:any[]){return apiAction('dev','rejectPendingAction',args);}
export async function getCredits(...args:any[]){return apiAction('dev','getCredits',args);}
export async function deleteProject(...args:any[]){return apiAction('dev','deleteProject',args);}
export async function getProjectDatabases(...args:any[]){return apiAction('dev','getProjectDatabases',args);}
export async function provisionNewDatabase(...args:any[]){return apiAction('dev','provisionNewDatabase',args);}
export async function runSqlQuery(...args:any[]){return apiAction('dev','runSqlQuery',args);}
export async function toggleProjectVisibility(...args:any[]){return apiAction('dev','toggleProjectVisibility',args);}
export async function createFileSystemItem(...args:any[]){return apiAction('dev','createFileSystemItem',args);}
export async function triggerBuild(...args:any[]){return apiAction('dev','triggerBuild',args);}
export async function getProjectInvitations(...args:any[]){return apiAction('dev','getProjectInvitations',args);}
export async function respondToProjectInvitation(...args:any[]){return apiAction('dev','respondToProjectInvitation',args);}

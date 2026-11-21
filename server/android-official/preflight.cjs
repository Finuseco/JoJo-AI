'use strict';
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {spawnSync}=require('node:child_process');
const sdk=process.env.ANDROID_SDK_ROOT||process.env.ANDROID_HOME;
function executable(file,args){const r=spawnSync(file,args,{timeout:15000,encoding:'utf8'});return {available:!r.error&&r.status===0,exitCode:r.status};}
let kvm=false;try{fs.accessSync('/dev/kvm',fs.constants.R_OK|fs.constants.W_OK);kvm=true;}catch{}
const tools=sdk?{
 sdkmanager:executable(path.join(sdk,'cmdline-tools/latest/bin/sdkmanager'),['--version']),
 avdmanager:executable(path.join(sdk,'cmdline-tools/latest/bin/avdmanager'),['list','device']),
 emulator:executable(path.join(sdk,'emulator/emulator'),['-accel-check']),
 adb:executable(path.join(sdk,'platform-tools/adb'),['version']),
}:{};
const ready=os.platform()==='linux'&&os.arch()==='x64'&&kvm&&Object.keys(tools).length===4&&Object.values(tools).every(t=>t.available);
console.log(JSON.stringify({ready,platform:os.platform(),architecture:os.arch(),kvm,cpuCount:os.cpus().length,memoryGiB:Math.round(os.totalmem()/1024**3),sdkConfigured:!!sdk,tools,target:{profile:'pixel_7',api:34,image:'system-images;android-34;google_apis;x86_64'},streamingValidated:false},null,2));
process.exitCode=ready?0:1;

const MonacoWebpackPlugin=require('monaco-editor-webpack-plugin');
/** @type {import('next').NextConfig} */
module.exports={experimental:{serverActions:{bodySizeLimit:'12mb'}},webpack(config,{isServer}){if(!isServer)config.plugins.push(new MonacoWebpackPlugin({languages:['javascript','typescript','json','css','html','java','csharp','python','markdown','yaml','shell','sql','xml'],filename:'static/monaco/[name].worker.js',publicPath:'/_next/'}));return config;}};

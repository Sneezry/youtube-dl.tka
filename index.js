const fs = require('fs');
const os = require('os');
const path = require('path');
const vscode = require('vscode');
const youtubedl = require('youtube-dl');
let wv;

exports.main = function(webview) {
  wv = webview;
}

exports.getInfo = async function(url) {
  return new Promise((resolve, reject) => {
    youtubedl.exec(url, ['--dump-json'], {}, function(err, output) {
      if (err) {
        reject(err);
        return;
      };
      if (!output || !output[0]) {
        resolve({});
        return;
      }
      try {
        output = JSON.parse(output[0]);
      } catch(e) {
        reject(e);
        return;
      }
      resolve(output);
      return;
    });
  });
}

exports.download = async function(url, filePath, format, total) {
  let pos = 0;
  let deltaT = 0;
  let deltaD = 0;
  let lastTime = new Date().getTime();
  const fsStream = fs.createWriteStream(filePath);
  fsStream.on('finish', () => {
    wv.send({type: 'download', data: 'finish'});
  });
  const video = youtubedl(url, ['--format=' + format]);
  video.on('data', chunk => {
    pos += chunk.length;
    const percent = total ? pos / total : 0;
    deltaD += chunk.length;
    deltaT =  new Date().getTime() - lastTime;
    if (deltaT >= 1000) {
      const speed = Math.round(deltaD * 1000 / deltaT);
      deltaD = 0;
      deltaT = 0;
      lastTime = new Date().getTime();
      wv.send({type: 'download', data: percent, speed});
    } else {
      wv.send({type: 'download', data: percent});
    }
  });
  video.pipe(fsStream);
}

exports.selectSavePath = async function() {
  const savePathChoice = await vscode.window.showOpenDialog({
    canSelectFiles: false,
    canSelectFolders: true,
    canSelectMany: false
  });

  if (!savePathChoice || !savePathChoice[0]) {
    return;
  }

  const savePath = savePathChoice[0].fsPath;
  return savePath;
}

exports.getDefaultSavePath = function() {
  const defaultPath = path.join(os.homedir(), 'Downloads');
  return defaultPath;
}
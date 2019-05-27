let videoInfo;
let savePath;
let total;
let ext;
let speed;

function updateInfo() {
  document.getElementById('thumbnail').style.backgroundImage = `url(${videoInfo.thumbnail})`;
  document.getElementById('title').innerHTML = videoInfo.title;
  document.getElementById('title').title = videoInfo.title;
  document.getElementById('description').innerHTML = videoInfo.description;
  document.getElementById('format').innerHTML = videoInfo.formats[0].format_note + '(' + videoInfo.formats[0].ext + ')';
  document.getElementById('size').innerHTML = convertSize(videoInfo.formats[0].filesize);
  total = videoInfo.formats[0].filesize;
  ext = videoInfo.formats[0].ext;
  const format = document.getElementById('format-select');
  let options = '';
  for (let i = 0; i < videoInfo.formats.length; i++) {
    if (i === 0) {
      options += `<option value="${videoInfo.formats[i].format_id}" selected>${videoInfo.formats[i].format_note + '(' + videoInfo.formats[i].ext + ')'}</option>`;
    } else {
      options += `<option value="${videoInfo.formats[i].format_id}">${videoInfo.formats[i].format_note + '(' + videoInfo.formats[i].ext + ')'}</option>`;
    }
  }
  format.innerHTML = options;
  format.disabled = false;
}

function updateFormat() {
  const format = document.getElementById('format-select').value;
  for (let i = 0; i < videoInfo.formats.length; i++) {
    if (videoInfo.formats[i].format_id === format) {
      document.getElementById('format').innerHTML = videoInfo.formats[i].format_note + '(' + videoInfo.formats[i].ext + ')';
      document.getElementById('size').innerHTML = convertSize(videoInfo.formats[i].filesize);
      total = videoInfo.formats[i].filesize;
      ext = videoInfo.formats[i].ext;
      break;
    }
  }
}

function convertSize(size) {
  if (size < 512) {
    return size + 'B';
  }
  size = Math.round(size / 1024);
  if (size < 512) {
    return size += 'KB';
  }
  size = Number((size / 1024).toFixed(2));
  if (size < 512) {
    return size += 'MB';
  }
  size = Number((size / 1024).toFixed(2));
  return size += 'GB';
}

async function updateSavePath() {
  const savePath = await NodeJS.selectSavePath();
  if (savePath) {
    document.getElementById('save-path').innerHTML = savePath;
    document.getElementById('save-path').title = savePath;
  }
}

async function init() {
  savePath = await NodeJS.getDefaultSavePath();
  document.getElementById('save-path').innerHTML = savePath;
  document.getElementById('save-path').title = savePath;

  document.getElementById('url').onchange = async () => {
    document.getElementById('info').style.display = 'none';
    document.getElementById('progress').value = 0;
    document.getElementById('download').disabled = true;
    document.getElementById('format-select').disabled = true;
    document.getElementById('format-select').innerHTML = '<option value="0" selected>...</option>';
    document.getElementById('thumbnail').style.backgroundImage = 'none';
    document.getElementById('title').innerHTML = '';
    document.getElementById('title').title = '';
    document.getElementById('description').innerHTML = '';
    document.getElementById('format').innerHTML = '';
    document.getElementById('size').innerHTML = '';
  
    let url = document.getElementById('url').value;
    if (!url) {
      return;
    }
    url = url.replace(/^\s*|\s*$/g, '');
  
    if (!/^http(s?):\/\/www.youtube.com\/watch\?v=/.test(url)) {
      return;
    }
    
    document.getElementById('loading').style.display = 'block';
    videoInfo = await NodeJS.getInfo(url);
    document.getElementById('loading').style.display = 'none';
    document.getElementById('url').disabled = true;
    updateInfo();
    document.getElementById('info').style.display = 'block';
    document.getElementById('download').disabled = false;
    document.getElementById('url').disabled = false;
  }

  document.getElementById('download').onclick = () => {
    let url = document.getElementById('url').value;
    url = url.replace(/^\s*|\s*$/g, '');
    const format = document.getElementById('format-select').value;
    const fsPath = savePath + '/' + videoInfo._filename.replace(/\.[^\.]+$/, '.' + ext);
    document.getElementById('url').disabled = true;
    NodeJS.download(url, fsPath, format, total);
    document.getElementById('format-select').disabled = true;
    document.getElementById('download').disabled = true;
  }
  
  document.getElementById('format-select').onchange = updateFormat;
  document.getElementById('change-save-path').onclick = updateSavePath;
}

function messager(data) {
  if (data.type === 'download') {
    if (data.data === 'finish') {
      document.getElementById('progress').value = 100;
      document.getElementById('progress').setAttribute('label', 'Finished!');
      document.getElementById('url').disabled = false;
      document.getElementById('format-select').disabled = false;
    } else {
      document.getElementById('progress').value = data.data * 100;
      if (data.speed !== undefined) {
        speed = data.speed;
      }
      document.getElementById('progress').setAttribute('label', Math.round(data.data * 100) + '%, ' + convertSize(speed) + '/s');
    }
  }
}

init();
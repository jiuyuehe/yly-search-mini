import * as Cons from "../constants/fileTypes";

const iconUrl = (name) => new URL(`../assets/ftsicon/${name}`, import.meta.url).href;

export const parseftsIcon = function (item = {}) {
  let src = iconUrl('unknown.png');
  if (item.folder) {
    return iconUrl('folder.png');
  }
  const fileType = Cons.getFileExtenName ? Cons.getFileExtenName(item.fileName || item.name || '') : '';
  switch (fileType) {
    case 'ppt': case 'pptx': case 'wpt': case 'dps': case 'pps': case 'pptm':
      src = iconUrl('pptx.png'); break;
    case 'pdf': src = iconUrl('pdf.png'); break;
    case 'xlsx': case 'xls': case 'xltm': case 'xlsm': case 'xlts': case 'csv':
      src = iconUrl('xlsx.png'); break;
    case 'doc': case 'docx': case 'wps': case 'dot':
      src = iconUrl('word.png'); break;
    case 'htm': case 'html': src = iconUrl('html.png'); break;
    case 'zip': case 'rar': src = iconUrl('winrar.png'); break;
    case 'txt': case 'rtf': src = iconUrl('txt.png'); break;
    case 'xmind': src = iconUrl('xmind.jpeg'); break;
  }
  // 图片缩略图逻辑
  if (Cons.FILE_TYPE.pic && Array.isArray(Cons.FILE_TYPE.pic) && Cons.FILE_TYPE.pic.includes(fileType)) {
    if (!item.fsFileThumb) {
      src = iconUrl('pics.png');
    } else if (typeof item.fsFileThumb === 'string' && item.fsFileThumb.startsWith('http')) {
      src = item.fsFileThumb;
    } else if (typeof item.fsFileThumb === 'string') {
      const host = window.location.origin.replace(/\/$/, '') + '/';
      src = host + item.fsFileThumb.replace(/^\//,'');
    }
  }
  if (Cons.FILE_TYPE.audio && Array.isArray(Cons.FILE_TYPE.audio) && Cons.FILE_TYPE.audio.includes(fileType)) {
    src = iconUrl('mp3.png');
  }
  if (Cons.FILE_TYPE.video && Array.isArray(Cons.FILE_TYPE.video) && Cons.FILE_TYPE.video.includes(fileType)) {
    src = iconUrl('mp4.png');
  }
  return src;
};
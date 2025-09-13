import axios from 'axios';
import { getCT } from './api';

export async function uploadStream({ file, param, url = '/upload/stream' }){
  const fd = new FormData();
  fd.append('file', file);
  fd.append('param', typeof param === 'string' ? param : JSON.stringify(param || {}));

  const headers = {
    'Content-Type': 'multipart/form-data',
    'ct': getCT() || '' ,
    'cv': localStorage.getItem('sysVer') || ''
  };

  const res = await axios.post(url, fd, { headers });
  return res && res.data ? res.data : res;
}

export default { uploadStream };

const form = document.getElementById('uploadForm');
const fileList = document.getElementById('fileList');

form.addEventListener('submit', async e => {
  e.preventDefault();
  const formData = new FormData(form);

  await fetch('/upload', {
    method: 'POST',
    body: formData
  });

  form.reset();
  loadFiles();
});

async function loadFiles() {
  const res = await fetch('/files');
  const files = await res.json();

  fileList.innerHTML = '';
  files.forEach(file => {
    const li = document.createElement('li');
    li.innerHTML = `
      <a href="/uploads/${file}" target="_blank">${file}</a>
      <button onclick="deleteFile('${file}')">Delete</button>
    `;
    fileList.appendChild(li);
  });
}

async function deleteFile(name) {
  await fetch(`/delete/${name}`, { method: 'DELETE' });
  loadFiles();
}

loadFiles();

class MarkSync {
    constructor() {
        this.socket = null;
        this.currentDocId = null;
        this.userName = 'Anonymous';
        
        this.init();
    }
    
    init() {
        const params = new URLSearchParams(window.location.search);
        this.currentDocId = params.get('doc') || 'default';
        
        this.editor = document.getElementById('editor');
        this.preview = document.getElementById('preview');
        this.docIdInput = document.getElementById('docId');
        this.userNameInput = document.getElementById('userName');
        this.status = document.getElementById('status');
        this.userList = document.getElementById('userList');
        
        this.docIdInput.value = this.currentDocId;
        this.userName = localStorage.getItem('userName') || 'Anonymous';
        this.userNameInput.value = this.userName;
        
        this.connectSocket();
        this.setupEvents();
        this.loadDocument();
    }
    
    connectSocket() {
        this.socket = io();
        
        this.socket.on('connect', () => {
            this.status.textContent = 'Connected';
            this.status.classList.add('connected');
            this.joinDocument();
        });
        
        this.socket.on('disconnect', () => {
            this.status.textContent = 'Disconnected';
            this.status.classList.remove('connected');
        });
        
        this.socket.on('document-content', (data) => {
            this.editor.value = data.content;
            this.updatePreview();
            this.updateUserList(data.users);
        });
        
        this.socket.on('text-update', (data) => {
            const cursorPos = this.editor.selectionStart;
            
            if (data.changes.type === 'insert') {
                const before = this.editor.value.substring(0, data.changes.position);
                const after = this.editor.value.substring(data.changes.position);
                this.editor.value = before + data.changes.text + after;
            } else if (data.changes.type === 'delete') {
                const before = this.editor.value.substring(0, data.changes.position);
                const after = this.editor.value.substring(data.changes.position + data.changes.length);
                this.editor.value = before + after;
            }
            
            this.editor.selectionStart = cursorPos;
            this.editor.selectionEnd = cursorPos;
            this.updatePreview();
        });
        
        this.socket.on('user-joined', (data) => {
            this.addUserToList(data.userId, data.name);
        });
        
        this.socket.on('user-left', (data) => {
            this.removeUserFromList(data.userId);
        });
        
        this.socket.on('users-update', (users) => {
            this.updateUserList(users);
        });
    }
    
    setupEvents() {
        this.editor.addEventListener('input', (e) => {
            this.handleTextChange(e);
            this.updatePreview();
        });
        
        document.getElementById('loadBtn').addEventListener('click', () => {
            this.currentDocId = this.docIdInput.value.trim() || 'default';
            this.updateURL();
            this.loadDocument();
        });
        
        this.userNameInput.addEventListener('change', () => {
            this.userName = this.userNameInput.value.trim() || 'Anonymous';
            localStorage.setItem('userName', this.userName);
            this.joinDocument();
        });
        
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportHTML();
        });
        
        document.getElementById('clearBtn').addEventListener('click', () => {
            if (confirm('Clear document?')) {
                this.editor.value = '# New Document\n\nStart typing here...';
                this.handleTextChange({ target: this.editor });
                this.updatePreview();
            }
        });
    }
    
    async loadDocument() {
        try {
            const response = await fetch(`/api/docs/${this.currentDocId}`);
            const data = await response.json();
            
            if (this.socket && this.socket.connected) {
                this.joinDocument();
            } else {
                this.editor.value = data.content;
                this.updatePreview();
            }
        } catch (error) {
            console.error('Error loading:', error);
        }
    }
    
    joinDocument() {
        if (this.socket && this.socket.connected) {
            this.socket.emit('join-document', {
                docId: this.currentDocId,
                userName: this.userName
            });
        }
    }
    
    handleTextChange(e) {
        if (!this.socket || !this.socket.connected) return;
        
        const text = e.target.value;
        const cursorPos = e.target.selectionStart;
        const oldText = this.lastText || '';
        this.lastText = text;
        
        if (text.length > oldText.length) {
            const position = this.findDiffPosition(oldText, text);
            const inserted = text.substring(position, position + (text.length - oldText.length));
            
            this.socket.emit('text-change', {
                docId: this.currentDocId,
                changes: {
                    type: 'insert',
                    position: position,
                    text: inserted
                },
                cursorPos: cursorPos
            });
        } else if (text.length < oldText.length) {
            const position = this.findDiffPosition(text, oldText);
            
            this.socket.emit('text-change', {
                docId: this.currentDocId,
                changes: {
                    type: 'delete',
                    position: position,
                    length: oldText.length - text.length
                },
                cursorPos: cursorPos
            });
        }
    }
    
    findDiffPosition(str1, str2) {
        const length = Math.min(str1.length, str2.length);
        for (let i = 0; i < length; i++) {
            if (str1[i] !== str2[i]) return i;
        }
        return length;
    }
    
    updatePreview() {
        if (typeof marked !== 'undefined') {
            this.preview.innerHTML = marked.parse(this.editor.value);
        } else {
            this.preview.textContent = this.editor.value;
        }
    }
    
    updateUserList(users) {
        this.userList.innerHTML = '';
        
        if (users.length === 0) {
            this.userList.innerHTML = '<div class="user-item">No users online</div>';
            return;
        }
        
        users.forEach(user => {
            const userEl = document.createElement('div');
            userEl.className = 'user-item';
            userEl.id = `user-${user.id || 'local'}`;
            userEl.textContent = `${user.name} ${user.id === this.socket?.id ? '(You)' : ''}`;
            this.userList.appendChild(userEl);
        });
    }
    
    addUserToList(userId, name) {
        this.removeUserFromList(userId);
        
        const userEl = document.createElement('div');
        userEl.className = 'user-item';
        userEl.id = `user-${userId}`;
        userEl.textContent = name;
        this.userList.appendChild(userEl);
    }
    
    removeUserFromList(userId) {
        const userEl = document.getElementById(`user-${userId}`);
        if (userEl) userEl.remove();
    }
    
    updateURL() {
        const url = new URL(window.location);
        url.searchParams.set('doc', this.currentDocId);
        window.history.pushState({}, '', url);
    }
    
    exportHTML() {
        const html = `
<!DOCTYPE html>
<html>
<head><title>${this.currentDocId}</title></head>
<body>${marked.parse(this.editor.value)}</body>
</html>`;
        
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.currentDocId}.html`;
        a.click();
        URL.revokeObjectURL(url);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new MarkSync();
});
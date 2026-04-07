export class GistSync {
    constructor(token, gistId = null) {
        this.token = token;
        this.gistId = gistId;
        this.baseUrl = 'https://api.github.com/gists';
        this.headers = {
            'Accept': 'application/vnd.github.v3+json',
            'Authorization': `token ${this.token}`,
            'Content-Type': 'application/json'
        };
    }

    async testConnection() {
        try {
            const response = await fetch('https://api.github.com/user', { headers: this.headers });
            return response.ok;
        } catch (e) {
            return false;
        }
    }

    async createGist(data, filename = '36-xun-backup.json') {
        const payload = {
            description: '36 Xun Calendar Backup',
            public: false,
            files: {
                [filename]: {
                    content: JSON.stringify(data, null, 2)
                }
            }
        };

        const response = await fetch(this.baseUrl, {
            method: 'POST',
            headers: this.headers,
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error('Failed to create gist');
        const result = await response.json();
        this.gistId = result.id;
        return result.id;
    }

    async updateGist(data, filename = '36-xun-backup.json') {
        if (!this.gistId) return this.createGist(data, filename);

        const payload = {
            files: {
                [filename]: {
                    content: JSON.stringify(data, null, 2)
                }
            }
        };

        const response = await fetch(`${this.baseUrl}/${this.gistId}`, {
            method: 'PATCH',
            headers: this.headers,
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error('Failed to update gist');
        return true;
    }

    async fetchGist() {
        if (!this.gistId) throw new Error('No Gist ID provided');
        
        const response = await fetch(`${this.baseUrl}/${this.gistId}`, {
            headers: this.headers
        });
        
        if (!response.ok) throw new Error('Failed to fetch gist');
        const result = await response.json();
        
        // Find our file
        const file = Object.values(result.files).find(f => f.filename.endsWith('.json'));
        if (!file) throw new Error('No valid backup file found in Gist');
        
        return JSON.parse(file.content);
    }
}

// Browser-only storage (localStorage). Prototype only: NOT secure and can be lost if browser data is cleared -> use Export Backup.
const Store={key:'farmdss_v1',load(){try{const r=localStorage.getItem(this.key);if(r)return JSON.parse(r)}catch(e){}return seed()},save(s){localStorage.setItem(this.key,JSON.stringify(s))},reset(){localStorage.removeItem(this.key)}};

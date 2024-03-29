import { createPinia } from 'pinia';
import { createApp } from 'vue';
import { createWebHistory, createRouter } from 'vue-router';

import Main from '@/pages/Main.vue';
import Safes from '@/pages/Safes.vue';

import App from './App.vue';

const routerHistory = createWebHistory();
const router = createRouter({
  history: routerHistory,
  routes: [
    { path: '/', component: Main },
    { path: '/safes', component: Safes },
  ],
});

const app = createApp(App);
const pinia = createPinia();

app.use(router);
app.use(pinia);

app.mount('#app');

export { routerHistory, router };

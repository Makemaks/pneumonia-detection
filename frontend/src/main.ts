import { createApp } from "vue";
import App from "./App.vue";

import PrimeVue from "primevue/config";
import Aura from "@primeuix/themes/aura";
import ToastService from "primevue/toastservice";
import "primeicons/primeicons.css";
import "./style.css";

import Button from "primevue/button";
import FileUpload from "primevue/fileupload";
import ProgressBar from "primevue/progressbar";
import Toast from "primevue/toast";

const app = createApp(App);

app.use(PrimeVue, {
  theme: {
    preset: Aura,
  },
});
app.use(ToastService);

app.component("Button", Button);
app.component("FileUpload", FileUpload);
app.component("ProgressBar", ProgressBar);
app.component("Toast", Toast);

app.mount("#app");

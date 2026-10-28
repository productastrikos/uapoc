/// <reference types="vite/client" />

/** Build-time settings from `.env` — see `.env.example` for what each means. */
interface ImportMetaEnv {
  readonly VITE_MQTT_URL?: string;
  readonly VITE_MQTT_TOPIC_PREFIX?: string;
  readonly VITE_MQTT_NODE_ID?: string;
  readonly VITE_MQTT_USERNAME?: string;
  readonly VITE_MQTT_PASSWORD?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

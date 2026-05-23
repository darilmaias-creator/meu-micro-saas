export const APP_HELP_CONTEXT_EVENT = "calcula-artesao:help-context";

export type HelpContextTopic = "material-cost";

export type AppHelpContextEventDetail = {
  topic: HelpContextTopic;
};

export function dispatchAppHelpContext(topic: HelpContextTopic) {
  window.dispatchEvent(
    new CustomEvent<AppHelpContextEventDetail>(APP_HELP_CONTEXT_EVENT, {
      detail: { topic },
    }),
  );
}

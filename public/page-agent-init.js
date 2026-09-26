(() => {
  let started = false;

  async function startPageAgent() {
    if (started) return;
    started = true;

    try {
      const { PageAgent } = await import("https://esm.sh/page-agent@1.12.4");

      const agent = new PageAgent({
        model: "@cf/zai-org/glm-4.7-flash",
        baseURL: "/api/page-agent/v1",
        apiKey: "",
        language: "en-US",
        maxSteps: 12,
        stepDelay: 0.5,
        experimentalScriptExecutionTool: false,
        instructions: {
          system:
            "Você é o assistente da Clínica São Paulo em Parnamirim/RN. " +
            "Responda em português do Brasil. Use somente informações presentes nesta página " +
            "ou claramente disponíveis no site. Não invente preços, horários, resultados, " +
            "diagnósticos, avaliações ou disponibilidade. Você pode ler a página, explicar " +
            "tratamentos, localizar informações e conduzir o visitante ao WhatsApp. " +
            "Não solicite nem processe dados médicos, documentos, senhas ou informações pessoais " +
            "sensíveis. Nunca execute JavaScript arbitrário. Para decisões clínicas, oriente o " +
            "visitante a falar diretamente com a equipe.",
        },
      });

      window.clinicaPageAgent = agent;
      agent.panel.show();
    } catch (error) {
      started = false;
      console.warn("[Page Agent] não foi carregado.", error);
    }
  }

  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(startPageAgent, { timeout: 2500 });
  } else {
    window.setTimeout(startPageAgent, 1800);
  }
})();
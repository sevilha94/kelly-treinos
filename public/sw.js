// Trabalhador de segundo plano: fica instalado no celular do aluno e recebe os
// lembretes mesmo com o aplicativo fechado. Nao faz mais nada — nao guarda
// pagina nem intercepta navegacao.

self.addEventListener("push", (evento) => {
  let dados = { titulo: "Kelly Jhuly", corpo: "Hora de treinar!", url: "/" };

  try {
    if (evento.data) dados = { ...dados, ...evento.data.json() };
  } catch {
    // notificacao sem corpo legivel: mostra o texto padrao em vez de sumir
  }

  evento.waitUntil(
    self.registration.showNotification(dados.titulo, {
      body: dados.corpo,
      icon: "/icone-192.png",
      badge: "/icone-192.png",
      vibrate: [200, 100, 200],
      data: { url: dados.url },
      // mesma tag substitui a anterior: nunca acumula lembrete velho na barra
      tag: "lembrete-treino",
    }),
  );
});

self.addEventListener("notificationclick", (evento) => {
  evento.notification.close();
  const destino = evento.notification.data?.url ?? "/";

  evento.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(
      (janelas) => {
        // se o treino ja estiver aberto numa aba, traz ela para a frente
        for (const janela of janelas) {
          if (janela.url.includes(destino) && "focus" in janela) {
            return janela.focus();
          }
        }
        return self.clients.openWindow(destino);
      },
    ),
  );
});

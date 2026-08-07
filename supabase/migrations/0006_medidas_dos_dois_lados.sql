-- Quadriceps e panturrilha existem dos dois lados.
--
-- Estavam gravados como medida unica, o que forcava a Kelly a escolher um lado
-- ou anotar uma media. Assimetria entre as pernas e justamente um dos sinais
-- que ela precisa enxergar: perna dominante costuma medir mais, e diferenca
-- grande demais pode indicar compensacao.
--
-- O biceps ja tinha os dois lados desde o inicio.

alter table avaliacao
  add column quadriceps_direito_cm numeric(5,1),
  add column quadriceps_esquerdo_cm numeric(5,1),
  add column panturrilha_direita_cm numeric(5,1),
  add column panturrilha_esquerda_cm numeric(5,1);

-- o que ja foi medido vai para o lado direito: e o que a maioria mede quando
-- so anota um. Nenhum numero se perde.
update avaliacao set quadriceps_direito_cm = quadriceps_cm
  where quadriceps_cm is not null;
update avaliacao set panturrilha_direita_cm = panturrilha_cm
  where panturrilha_cm is not null;

alter table avaliacao
  drop column quadriceps_cm,
  drop column panturrilha_cm;

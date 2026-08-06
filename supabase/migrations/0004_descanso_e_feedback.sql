-- Descanso entre series e feedback do treino.
--
-- Duas coisas pequenas que mudam o dia a dia: o descanso sai do campo de texto
-- livre e vira numero (para dar para cronometrar), e o aluno passa a dizer como
-- foi o treino, que e a informacao que faltava para a Kelly ajustar carga sem
-- esperar a proxima presencial.

alter table treino_exercicio
  add column descanso_segundos integer check (descanso_segundos between 0 and 900);

create type percepcao_treino as enum ('facil', 'na_medida', 'puxado');

alter table sessao
  add column percepcao percepcao_treino,
  add column comentario text;

-- Fotos leves: capa parada + animação separada, servidas pelo próprio site.
-- Rode inteiro em Supabase > SQL Editor. Pode rodar mais de uma vez.
-- Fotos trocadas pelo admin não são alteradas.

begin;

alter table public.products add column if not exists animation_url text;

update public.products set image_url = '/media/silverado-kit-inox-001.webp', animation_url = '/media/silverado-kit-inox-001-anim.webp'
  where slug = 'silverado-kit-inox-001' and image_url = 'https://i.ibb.co/23jX2FnW/Kit-Full-Inox-SILVERADO1.gif';
update public.products set image_url = '/media/cummins-6bt-kit-002.webp', animation_url = '/media/cummins-6bt-kit-002-anim.webp'
  where slug = 'cummins-6bt-kit-002' and image_url = 'https://i.ibb.co/S4CGfd5L/Cummins-6bt.gif';
update public.products set image_url = '/media/escape-full-inox-f250.webp', animation_url = '/media/escape-full-inox-f250-anim.webp'
  where slug = 'escape-full-inox-f250' and image_url = 'https://i.ibb.co/99xVbKj3/Kit-Full-Inox-SILVERADO.gif';
update public.products set image_url = '/media/embreagem-ceramica-f250.webp', animation_url = null
  where slug = 'embreagem-ceramica-f250' and image_url = 'https://i.ibb.co/qYRc9Mqg/Kit-de-Embreagem-de-Cer-mica.jpg';
update public.products set image_url = '/media/kit-performance-f250-mwm.webp', animation_url = null
  where slug = 'kit-performance-f250-mwm' and image_url = 'https://i.ibb.co/chQ1LYvk/Kit-Performance-Completo-F-250-MWM-Sprint.jpg';
update public.products set image_url = '/media/kit-performance-tatu-mwm-inox-bicos.webp', animation_url = null
  where slug = 'kit-performance-tatu-mwm-inox-bicos' and image_url = 'https://i.ibb.co/nq99xc76/Kit-de-Coletor-Dimensionado-e-Sa-da-de-Escapamento-MWM-Sprint-6-07.jpg';
update public.products set image_url = '/media/kit-premium-f250-intake-reservatorio.webp', animation_url = '/media/kit-premium-f250-intake-reservatorio-anim.webp'
  where slug = 'kit-premium-f250-intake-reservatorio' and image_url = 'https://i.ibb.co/1fx8NzsC/kit-premium.gif';
update public.products set image_url = '/media/kit-performance-f250-mwm-bomba-p7100.webp', animation_url = null
  where slug = 'kit-performance-f250-mwm-bomba-p7100' and image_url = 'https://i.ibb.co/ZzTrLL2s/Kit-Performance-F-250-MWM-Bomba-P7100.jpg';
update public.products set image_url = '/media/kit-full-inox-silverado-premium-gif.webp', animation_url = '/media/kit-full-inox-silverado-premium-gif-anim.webp'
  where slug = 'kit-full-inox-silverado-premium-gif' and image_url = 'https://i.ibb.co/ZpTbVjP4/Kit-Full-Inox-Silverado.gif';
update public.products set image_url = '/media/pino-lda-buster.webp', animation_url = '/media/pino-lda-buster-anim.webp'
  where slug = 'pino-lda-buster' and image_url = 'https://i.ibb.co/fGkBK3Wh/Pino-LDA.gif';
update public.products set image_url = '/media/kit-rodas-aro18-f250.webp', animation_url = '/media/kit-rodas-aro18-f250-anim.webp'
  where slug = 'kit-rodas-aro18-f250' and image_url = 'https://i.ibb.co/20N184vs/Kit-com-4-Rodas.gif';
update public.products set image_url = '/media/kit-rodas-aro20-f250.webp', animation_url = '/media/kit-rodas-aro20-f250-anim.webp'
  where slug = 'kit-rodas-aro20-f250' and image_url = 'https://i.ibb.co/snBHBKW/Kit-aro-20.gif';
update public.products set image_url = '/media/kit-emblema-f250.webp', animation_url = '/media/kit-emblema-f250-anim.webp'
  where slug = 'kit-emblema-f250' and image_url = 'https://i.ibb.co/Zz0P97r9/Kit-emblema-F250.gif';
update public.products set image_url = '/media/kit-40cv-s10.webp', animation_url = null
  where slug = 'kit-40cv-s10' and image_url = 'https://i.ibb.co/N2xB0XqL/Kit-40-cavalos.png';
update public.products set image_url = '/media/turbina-borgwarner-70.webp', animation_url = null
  where slug = 'turbina-borgwarner-70' and image_url = 'https://i.ibb.co/mrkh4mk6/Turbina.png';
update public.products set image_url = '/media/lanterna-traseira-americana.webp', animation_url = '/media/lanterna-traseira-americana-anim.webp'
  where slug = 'lanterna-traseira-americana' and image_url = 'https://i.ibb.co/ZzrvCGYz/Lanterna-Traseira-Americana.gif';
update public.products set image_url = '/media/forro-corta-fogo-f250.webp', animation_url = null
  where slug = 'forro-corta-fogo-f250' and image_url = 'https://i.ibb.co/TDpDBhc5/Forro-corta-fogo-f250.png';
update public.products set image_url = '/media/defletor-superior-radiador-f250.webp', animation_url = null
  where slug = 'defletor-superior-radiador-f250' and image_url = 'https://i.ibb.co/7Nywmxd5/Defletor-Superior-Radiador-F250.png';
update public.products set image_url = '/media/kit-troca-oleo-mwm.webp', animation_url = null
  where slug = 'kit-troca-oleo-mwm' and image_url = 'https://i.ibb.co/qMf4xspw/kit-troca-de-oleo.jpg';
update public.products set image_url = '/media/filtro-diesel-f250-original.webp', animation_url = null
  where slug = 'filtro-diesel-f250-original' and image_url = 'https://i.ibb.co/wh4Fh0mC/Filtro-diesel-original.jpg';
update public.products set image_url = '/media/filtro-diesel-silverado-original.webp', animation_url = null
  where slug = 'filtro-diesel-silverado-original' and image_url = 'https://i.ibb.co/b5zQ2Gjy/Filtro-diesel-original-Silverado.jpg';
update public.products set image_url = '/media/oleo-aditivo-diesel.webp', animation_url = null
  where slug = 'oleo-aditivo-diesel' and image_url = 'https://i.ibb.co/hJSKzmHC/leo-aditivo-para-motores-diesel.jpg';
update public.products set image_url = '/media/oleo-motor-diesel.webp', animation_url = null
  where slug = 'oleo-motor-diesel' and image_url = 'https://i.ibb.co/SXt3SQLZ/leo-para-motores-diesel.jpg';
update public.products set image_url = '/media/parafuso-cabecote-mwm.webp', animation_url = null
  where slug = 'parafuso-cabecote-mwm' and image_url = 'https://i.ibb.co/ZRRCpKB7/Parafuso-do-cabe-ote-MWM-Sprint.jpg';
update public.products set image_url = '/media/junta-admissao-mwm-6cc.webp', animation_url = null
  where slug = 'junta-admissao-mwm-6cc' and image_url = 'https://i.ibb.co/HWb3Zrr/Junta-da-admiss-o-MWM-Sprint-6-cilindro.jpg';
update public.products set image_url = '/media/junta-cabecote-f250-mwm-aco.webp', animation_url = null
  where slug = 'junta-cabecote-f250-mwm-aco' and image_url = 'https://i.ibb.co/TMWHVqQJ/Junta-do-cabe-ote-F-250-MWM.jpg';
update public.products set image_url = '/media/kit-intake-performance.webp', animation_url = null
  where slug = 'kit-intake-performance' and image_url = 'https://i.ibb.co/YBXdjntr/Kit-intake.jpg';
update public.products set image_url = '/media/tampa-oleo-esportiva.webp', animation_url = null
  where slug = 'tampa-oleo-esportiva' and image_url = 'https://i.ibb.co/LXbDDz78/Tampa-de-oleo.jpg';
update public.products set image_url = '/media/bone-tatu-gif-01.webp', animation_url = '/media/bone-tatu-gif-01-anim.webp'
  where slug = 'bone-tatu-gif-01' and image_url = 'https://i.ibb.co/V09M4WPh/gif1.gif';
update public.products set image_url = '/media/bone-tatu-gif-02.webp', animation_url = '/media/bone-tatu-gif-02-anim.webp'
  where slug = 'bone-tatu-gif-02' and image_url = 'https://i.ibb.co/mrjNVNpf/gif2.gif';
update public.products set image_url = '/media/bone-tatu-gif-03.webp', animation_url = '/media/bone-tatu-gif-03-anim.webp'
  where slug = 'bone-tatu-gif-03' and image_url = 'https://i.ibb.co/8D9Dcs8b/gif4.gif';
update public.products set image_url = '/media/bone-tatu-gif-04.webp', animation_url = '/media/bone-tatu-gif-04-anim.webp'
  where slug = 'bone-tatu-gif-04' and image_url = 'https://i.ibb.co/ym4sCxwW/gif5.gif';
update public.products set image_url = '/media/copo-tatu-01.webp', animation_url = '/media/copo-tatu-01-anim.webp'
  where slug = 'copo-tatu-01' and image_url = 'https://i.ibb.co/Fkbrm98d/gif3.gif';
update public.products set image_url = '/media/camiseta-tatu-02.webp', animation_url = null
  where slug = 'camiseta-tatu-02' and image_url = 'https://i.ibb.co/JMv01Qp/6.jpg';
update public.products set image_url = '/media/camiseta-tatu-03.webp', animation_url = null
  where slug = 'camiseta-tatu-03' and image_url = 'https://i.ibb.co/Tqw6f90Q/modelo-03.jpg';
update public.products set image_url = '/media/camiseta-tatu-04.webp', animation_url = null
  where slug = 'camiseta-tatu-04' and image_url = 'https://i.ibb.co/YBNF0Ys7/modelo-04.jpg';
update public.products set image_url = '/media/camiseta-tatu-05.webp', animation_url = null
  where slug = 'camiseta-tatu-05' and image_url = 'https://i.ibb.co/93W6dvkk/modelo-05.jpg';
update public.products set image_url = '/media/camiseta-tatu-06.webp', animation_url = null
  where slug = 'camiseta-tatu-06' and image_url = 'https://i.ibb.co/xSyt24BC/modelo-06.jpg';
update public.products set image_url = '/media/camiseta-tatu-07.webp', animation_url = null
  where slug = 'camiseta-tatu-07' and image_url = 'https://i.ibb.co/fzDrn4XB/modelo-07.jpg';
update public.products set image_url = '/media/kit-churrasco-01.webp', animation_url = null
  where slug = 'kit-churrasco-01' and image_url = 'https://i.ibb.co/BKn7nGk8/1.jpg';
update public.products set image_url = '/media/capa-bateria-tatu-01.webp', animation_url = null
  where slug = 'capa-bateria-tatu-01' and image_url = 'https://i.ibb.co/XxzZ5WM4/capa-de-bateria.jpg';
update public.products set image_url = '/media/camiseta-tatu-01.webp', animation_url = null
  where slug = 'camiseta-tatu-01' and image_url = 'https://i.ibb.co/wN9pQncw/1.jpg';

commit;

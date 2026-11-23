import { Product } from './types';

export const WHATSAPP_NUMBER = '5535997172069'; 
export const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}`;
export const INSTAGRAM_LINK = 'https://www.instagram.com/tatu_preparacoes?igsh=MTZjeGt6cTZnczhocQ==';
export const TIKTOK_LINK = 'https://www.tiktok.com/@tatupreparacoes';
export const GOOGLE_MAPS_SHARE_LINK = 'https://share.google/ODOAHc3rcuii2Wdy5';
export const LOCATION_SEARCH_QUERY = 'Tatu Preparações, Três Pontas, MG';

export const CATEGORIES: readonly string[] = [
  "Todos",
  "Kits F250",
  "Kits Silverado",
  "Kits RAM",
  "Motores",
  "Bonés",
  "Copos",
  "Camisetas",
  "Kits Churrasco",
  "Filtros",
  "Pneus",
  "Baterias",
  "Suspensão",
  "Iluminação"
];

export const STATIC_PRODUCTS: Product[] = [
  {
    id: 'silverado-kit-inox-001',
    name: 'Kit Full Inox Motor Silverado',
    category: 'Kits Silverado',
    image: 'https://i.ibb.co/23jX2FnW/Kit-Full-Inox-SILVERADO1.gif', 
    description: `Reservatório de água
Entrada do radiador (com mangotes de silicone e 4 abraçadeiras)
Pressurização (para turbina grande ou pequena + um mangote de silicone 2 abraçadeiras)
Intake com filtro de ar (mangote silicone e 1 abraçadeira`
  },
  {
    id: 'cummins-6bt-kit-002',
    name: 'Kit Performance - Cummins 6BT',
    category: 'Motores',
    image: 'https://i.ibb.co/S4CGfd5L/Cummins-6bt.gif',
    description: `Coletor dimensionado com parafuso de fixação 
6 ponteiras de bico de alta performance 
Válvulas de alivio 
Turbina retrabalhada .70 Holset
Junta de aço inox`
  },
  {
    id: 'escape-full-inox-f250',
    name: 'Escape Silverado MWM Full Inox c/ Downpipe',
    category: 'Kits Silverado',
    image: 'https://i.ibb.co/99xVbKj3/Kit-Full-Inox-SILVERADO.gif',
    description: 'Escapamento de 4″ com flexível e ponteira de 5″'
  },
  {
    id: 'embreagem-ceramica-f250',
    name: 'Kit Embreagem Preparada para F-250 Estágio 1',
    category: 'Kits F250',
    image: 'https://i.ibb.co/qYRc9Mqg/Kit-de-Embreagem-de-Cer-mica.jpg',
    description: `Plator retrabalhado 
Rolamento de embreagem 
Disco de embreagem pastilhado`
  },
  {
    id: 'kit-performance-f250-mwm',
    name: 'Kit 200 cv’s Acima do Original para F-250 / Silverado MWM',
    category: 'Kits F250',
    image: 'https://i.ibb.co/chQ1LYvk/Kit-Performance-Completo-F-250-MWM-Sprint.jpg',
    description: `Coletor dimensionado T3
12 parafusos de fixação 
6 ponteiras de bico de alta performance
Junta do cabeçote de aço 
Junta do coletor de aço inox
Bomba injetora preparada e revisada (A BASE DE TROCA) 200cv
Turbina retrabalhada .70 Borgwarner
Válvula de alívio
Kit bomba elétrica c/ dosador ou bomba mecânica
Junta da admissão original
Filtro lubrificante original
Kit junta da tampa de válvula
Kit retorno e flexível de turbina
Curva de turbinada com saída para válvula
1 bardal e 1 militec 
Jogo de prisioneiros de turbina
Jogo de junta de turbina`
  },
  {
    id: 'kit-performance-tatu-mwm-inox-bicos',
    name: 'Kit 50 cv’s para Silverado',
    category: 'Motores',
    image: 'https://i.ibb.co/nq99xc76/Kit-de-Coletor-Dimensionado-e-Sa-da-de-Escapamento-MWM-Sprint-6-07.jpg',
    description: `Coletor dimensionado 
12 parafusos de fixação 
6 ponteiras de bico de alta vazão 
Pressurização full inox
1 mangote de silicone com 2 abraçadeiras`
  },
  {
    id: 'kit-premium-f250-intake-reservatorio',
    name: 'Kit Full Inox Cofre F-250',
    category: 'Kits F250',
    image: 'https://i.ibb.co/1fx8NzsC/kit-premium.gif',
    description: `Kit intake com filtro de ar (1 mangote de silicone 2 abraçadeiras)
Reservatório de água 
Reservatório de direção hidráulica 
Protetor da caixa do ar condicionado
Calha do chicote de fio
Saída do Intercooler (2 mangotes de silicone + 4 abraçadeiras)
Tampão do sistema do ABS
Entrada do Intercooler
Kit escapamento full inox c/ Downpipe`
  },
  {
    id: 'kit-performance-f250-mwm-bomba-p7100',
    name: 'Kit 100 cv’s Acima do Original para F-250 / Silverado MWM',
    category: 'Kits F250',
    image: 'https://i.ibb.co/ZzTrLL2s/Kit-Performance-F-250-MWM-Bomba-P7100.jpg',
    description: `Coletor dimensionado
12 parafusos de fixação
6 ponteiras de bico alta vazão 
Bomba injetora preparada e revisada (A BASE DE TROCA)`
  },
  {
    id: 'kit-full-inox-silverado-premium-gif',
    name: 'Escape Full Inox F-250 MWM c/ Downpipe',
    category: 'Kits F250',
    image: 'https://i.ibb.co/ZpTbVjP4/Kit-Full-Inox-Silverado.gif',
    description: 'Escapamento de 4″ com flexível e ponteira de 5″'
  },
  {
    id: 'pino-lda-buster',
    name: 'Kit LDA buster',
    category: 'Motores',
    image: 'https://i.ibb.co/fGkBK3Wh/Pino-LDA.gif',
    description: `Pino em aço forjado padrão gringo desenvolvido para performance com extrema qualidade e durabilidade junto a mola de pressão calibrada para maior desempenho

01 PINO DE AÇO FORJADO
01 MOLA DE PRESSÃO`
  },
  {
    id: 'kit-rodas-aro18-f250',
    name: 'Kit com 4 Rodas, Aro 18 F-250',
    category: 'Kits F250',
    image: 'https://i.ibb.co/20N184vs/Kit-com-4-Rodas.gif',
    description: 'Jogo completo com 4 rodas aro 18 para F-250. Visual exclusivo e acabamento premium.'
  },
  {
    id: 'kit-rodas-aro20-f250',
    name: 'Kit com 4 Rodas, Aro 20 F-250',
    category: 'Kits F250',
    image: 'https://i.ibb.co/snBHBKW/Kit-aro-20.gif',
    description: 'Jogo completo com 4 rodas aro 20 para F-250. Visual exclusivo e acabamento premium.'
  },
  {
    id: 'kit-emblema-f250',
    name: 'Kit Emblema F-250',
    category: 'Kits F250',
    image: 'https://i.ibb.co/Zz0P97r9/Kit-emblema-F250.gif',
    description: 'Renove a identidade da sua bruta. Kit completo de emblemas com acabamento impecável.'
  },
  {
    id: 'kit-40cv-s10',
    name: 'Kit 40 cv’s para S10',
    category: 'Motores',
    image: 'https://i.ibb.co/N2xB0XqL/Kit-40-cavalos.png',
    description: `Coletor dimensionado 
8 parafusos de fixação 
4 ponteiras de bico de alta vazão`
  },
  {
    id: 'turbina-borgwarner-70',
    name: 'Turbina Retrabalhada .70 Borgwarner',
    category: 'Motores',
    image: 'https://i.ibb.co/mrkh4mk6/Turbina.png',
    description: 'Turbina retrabalhada para motores MWM'
  },
  {
    id: 'lanterna-traseira-americana',
    name: 'Lanterna Traseira Americana',
    category: 'Iluminação',
    image: 'https://i.ibb.co/ZzrvCGYz/Lanterna-Traseira-Americana.gif',
    description: 'Estilo americano clássico e iluminação de alta visibilidade para sua caminhonete.'
  },
  {
    id: 'forro-corta-fogo-f250',
    name: 'Forro Corta Fogo',
    category: 'Kits F250',
    image: 'https://i.ibb.co/TDpDBhc5/Forro-corta-fogo-f250.png',
    description: 'Proteção térmica e isolamento acústico para o cofre do motor. Item essencial para conservação e performance.'
  },
  {
    id: 'defletor-superior-radiador-f250',
    name: 'Defletor Superior Radiador F-250',
    category: 'Kits F250',
    image: 'https://i.ibb.co/7Nywmxd5/Defletor-Superior-Radiador-F250.png',
    description: 'Acabamento e proteção para a parte superior do radiador. Melhora a estética do cofre e auxilia no direcionamento de ar.'
  },
  {
    id: 'kit-troca-oleo-mwm',
    name: 'Kit troca de óleo - MWM Sprint Silverado e F-250',
    category: 'Filtros',
    image: 'https://i.ibb.co/qMf4xspw/kit-troca-de-oleo.jpg',
    description: 'Kit completo para troca de óleo e filtros. Essencial para a manutenção preventiva do motor MWM Sprint.'
  },
  {
    id: 'filtro-diesel-f250-original',
    name: 'Filtro diesel original F-250',
    category: 'Filtros',
    image: 'https://i.ibb.co/wh4Fh0mC/Filtro-diesel-original.jpg',
    description: 'Filtro de combustível original para F-250. Garanta a pureza do diesel e a proteção do seu sistema de injeção.'
  },
  {
    id: 'filtro-diesel-silverado-original',
    name: 'Filtro diesel original Silverado',
    category: 'Filtros',
    image: 'https://i.ibb.co/b5zQ2Gjy/Filtro-diesel-original-Silverado.jpg',
    description: 'Filtro de combustível original para Silverado. Essencial para manter o desempenho e durabilidade do motor.'
  },
  {
    id: 'oleo-aditivo-diesel',
    name: 'Óleo aditivo para motores diesel',
    category: 'Filtros',
    image: 'https://i.ibb.co/hJSKzmHC/leo-aditivo-para-motores-diesel.jpg',
    description: 'Aditivo de alta performance para motores diesel. Melhora a combustão, limpa o sistema e protege contra corrosão.'
  },
  {
    id: 'oleo-motor-diesel',
    name: 'Óleo para motores diesel',
    category: 'Filtros',
    image: 'https://i.ibb.co/SXt3SQLZ/leo-para-motores-diesel.jpg',
    description: 'Lubrificante de alta qualidade para motores diesel. Proteção superior contra desgaste e borra.'
  },
  {
    id: 'parafuso-cabecote-mwm',
    name: 'Parafuso do cabeçote MWM Sprint',
    category: 'Motores',
    image: 'https://i.ibb.co/ZRRCpKB7/Parafuso-do-cabe-ote-MWM-Sprint.jpg',
    description: 'Jogo de parafusos para cabeçote do motor MWM Sprint. Alta resistência para aguentar a pressão.'
  },
  {
    id: 'junta-admissao-mwm-6cc',
    name: 'Junta da admissão MWM Sprint 6 cilindro',
    category: 'Motores',
    image: 'https://i.ibb.co/HWb3Zrr/Junta-da-admiss-o-MWM-Sprint-6-cilindro.jpg',
    description: 'Junta de vedação para coletor de admissão do motor MWM Sprint 6 cilindros. Material resistente e encaixe perfeito.'
  },
  {
    id: 'junta-cabecote-f250-mwm-aco',
    name: 'Junta do cabeçote F-250 MWM',
    category: 'Motores',
    image: 'https://i.ibb.co/TMWHVqQJ/Junta-do-cabe-ote-F-250-MWM.jpg',
    description: 'Junta de cabeçote de alta resistência para motores MWM F-250. Essencial para preparações e manutenção.'
  },
  {
    id: 'kit-intake-performance',
    name: 'Kit Intake',
    category: 'Motores',
    image: 'https://i.ibb.co/YBXdjntr/Kit-intake.jpg',
    description: 'Sistema de admissão de ar de alta performance. Aumenta o fluxo de ar para o motor e proporciona um visual esportivo.'
  },
  {
    id: 'tampa-oleo-esportiva',
    name: 'Tampa do óleo',
    category: 'Motores',
    image: 'https://i.ibb.co/LXbDDz78/Tampa-de-oleo.jpg',
    description: 'Tampa de óleo em alumínio com acabamento anodizado. Estilo e qualidade para o cofre do motor.'
  },
  // BONÉS
  {
    id: 'bone-tatu-gif-01',
    name: 'Boné Tatu Trucker - Modelo 01',
    category: 'Bonés',
    image: 'https://i.ibb.co/V09M4WPh/gif1.gif',
    description: 'Estilo e atitude Tatu Preparações. Peça o seu boné!'
  },
  {
    id: 'bone-tatu-gif-02',
    name: 'Boné Tatu Trucker - Modelo 02',
    category: 'Bonés',
    image: 'https://i.ibb.co/mrjNVNpf/gif2.gif',
    description: 'Qualidade premium e design exclusivo. Garanta o seu!'
  },
  {
    id: 'bone-tatu-gif-03',
    name: 'Boné Tatu Trucker - Modelo 03',
    category: 'Bonés',
    image: 'https://i.ibb.co/8D9Dcs8b/gif4.gif',
    description: 'Para quem veste a camisa da marca. Adquira já!'
  },
  {
    id: 'bone-tatu-gif-04',
    name: 'Boné Tatu Trucker - Modelo 04',
    category: 'Bonés',
    image: 'https://i.ibb.co/ym4sCxwW/gif5.gif',
    description: 'Complete seu visual com estilo. Compre agora!'
  },
  // COPOS
  {
    id: 'copo-tatu-01',
    name: 'Copo Térmico Tatu - Edição Especial',
    category: 'Copos',
    image: 'https://i.ibb.co/Fkbrm98d/gif3.gif',
    description: 'Bebida gelada até o último gole. Garanta o seu copo!'
  },
  // CAMISETAS
  {
    id: 'camiseta-tatu-01',
    name: 'Camiseta Tatu - Modelo 01',
    category: 'Camisetas',
    image: 'https://i.ibb.co/wN9pQncw/1.jpg',
    description: 'Conforto e durabilidade. Vista Tatu Preparações!'
  },
  {
    id: 'camiseta-tatu-02',
    name: 'Camiseta Tatu - Modelo 02',
    category: 'Camisetas',
    image: 'https://i.ibb.co/JMv01Qp/6.jpg',
    description: 'Conforto e durabilidade. Vista Tatu Preparações!'
  },
  {
    id: 'camiseta-tatu-03',
    name: 'Camiseta Tatu - Modelo 03',
    category: 'Camisetas',
    image: 'https://i.ibb.co/Tqw6f90Q/modelo-03.jpg',
    description: 'Conforto e durabilidade. Vista Tatu Preparações!'
  },
  {
    id: 'camiseta-tatu-04',
    name: 'Camiseta Tatu - Modelo 04',
    category: 'Camisetas',
    image: 'https://i.ibb.co/YBNF0Ys7/modelo-04.jpg',
    description: 'Conforto e durabilidade. Vista Tatu Preparações!'
  },
  {
    id: 'camiseta-tatu-05',
    name: 'Camiseta Tatu - Modelo 05',
    category: 'Camisetas',
    image: 'https://i.ibb.co/93W6dvkk/modelo-05.jpg',
    description: 'Conforto e durabilidade. Vista Tatu Preparações!'
  },
  {
    id: 'camiseta-tatu-06',
    name: 'Camiseta Tatu - Modelo 06',
    category: 'Camisetas',
    image: 'https://i.ibb.co/xSyt24BC/modelo-06.jpg',
    description: 'Conforto e durabilidade. Vista Tatu Preparações!'
  },
  {
    id: 'camiseta-tatu-07',
    name: 'Camiseta Tatu - Modelo 07',
    category: 'Camisetas',
    image: 'https://i.ibb.co/fzDrn4XB/modelo-07.jpg',
    description: 'Conforto e durabilidade. Vista Tatu Preparações!'
  },
  // KITS CHURRASCO
  {
    id: 'kit-churrasco-01',
    name: 'Kit Churrasco Tatu Premium',
    category: 'Kits Churrasco',
    image: 'https://i.ibb.co/BKn7nGk8/1.jpg',
    description: 'Para o churrasqueiro de respeito. Adquira seu kit!'
  },
  // BATERIAS
  {
    id: 'capa-bateria-tatu-01',
    name: 'Capa de Bateria Tatu Preparações',
    category: 'Baterias',
    image: 'https://i.ibb.co/XxzZ5WM4/capa-de-bateria.jpg',
    description: 'O detalhe que faltava no seu cofre. Compre agora!'
  }
];

export interface Tip {
  text: string;
  source: string;
}

export const TIPS: Tip[] = [
  { text: "Decidi quando e dove. «Alle 18:30, in palestra sotto casa» funziona molto meglio di «questa settimana vado in palestra».", source: "Gollwitzer & Sheeran, 2006" },
  { text: "Rimandare quasi mai è pigrizia: è un modo per evitare un'emozione sgradevole. Dalle un nome, poi fai il primo passo lo stesso.", source: "Sirois & Pychyl, 2013" },
  { text: "Perdonarti per aver rimandato riduce la probabilità di rimandare la volta dopo. Colpevolizzarti la aumenta.", source: "Wohl, Pychyl & Bennett, 2010" },
  { text: "Inizia per soli 5 minuti. Un compito lasciato a metà tende a richiamarti: il difficile è partire.", source: "Effetto Zeigarnik" },
  { text: "Più una ricompensa è lontana, meno ti muove. Guarda l'obiettivo di questa settimana, non quello di giugno.", source: "Steel, 2007" },
  { text: "Abbina un piacere al compito: un podcast che ascolti solo in palestra, un caffè buono solo mentre studi.", source: "Milkman, Minson & Volpp, 2014" },
  { text: "Lunedì, inizio mese, dopo una pausa: i «nuovi inizi» sono il momento migliore per ripartire, anche dopo una settimana storta.", source: "Dai, Milkman & Riis, 2014" },
  { text: "Vedere i progressi, anche piccoli, è uno dei motivatori più forti che esistano. Spunta ogni attività fatta.", source: "Amabile & Kramer, 2011" },
  { text: "Un'abitudine si forma in circa due mesi, e saltare un giorno ogni tanto non la rompe.", source: "Lally et al., 2010" },
  { text: "Rendi il primo passo ridicolmente piccolo: non «studiare», ma «aprire il libro a pagina 40».", source: "Fogg, 2019" },
  { text: "Togli attrito a quello che vuoi fare e aggiungilo a quello che vuoi evitare: borsa pronta la sera, telefono in un'altra stanza.", source: "Wood, 2019" },
];

export function tipOfDay(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 0).getTime();
  return Math.floor((d.getTime() - start) / 86_400_000) % TIPS.length;
}

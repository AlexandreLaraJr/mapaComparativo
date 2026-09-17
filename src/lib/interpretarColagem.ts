import type { RequisicaoItem } from "../types/requisicao";
import { criarFornecedorVazio } from "../types/requisicao";

/**
 * Cada item ocupa 5 linhas no texto copiado do sistema, nesta ordem:
 *   1. número do material
 *   2. texto breve
 *   3. quantidade
 *   4. unidade de medida
 *   5. preço de avaliação
 */
const CAMPOS_POR_ITEM = 5;

export interface ResultadoColagem {
  itens: RequisicaoItem[];
  linhasIgnoradas: number;
}

export function interpretarColagem(texto: string, quantidadeFornecedores = 1): ResultadoColagem {
  // Normaliza quebras de linha (Windows usa \r\n) e descarta linhas vazias
  const linhas = texto
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((linha) => linha.trim())
    .filter((linha) => linha.length > 0);

  const itens: RequisicaoItem[] = [];
  let indice = 0;

  while (indice + CAMPOS_POR_ITEM <= linhas.length) {
    const [numeroMaterial, textoBreve, quantidade, unidadeMedida, precoAvaliacao] = linhas.slice(
      indice,
      indice + CAMPOS_POR_ITEM
    );

    itens.push({
      id: crypto.randomUUID(),
      ordem: itens.length + 1,
      numeroRC: "",
      numeroMaterial,
      textoBreve,
      quantidade: normalizarNumero(quantidade),
      unidadeMedida,
      precoAvaliacao: normalizarNumero(precoAvaliacao),
      fornecedores: Array.from({ length: quantidadeFornecedores }, () => criarFornecedorVazio()),
    });

    indice += CAMPOS_POR_ITEM;
  }

  return {
    itens,
    linhasIgnoradas: linhas.length - indice,
  };
}

/**
 * Converte número no formato brasileiro (1.234,56) para o formato que
 * inputs type="number" entendem (1234.56).
 */
function normalizarNumero(valor: string): string {
  if (!valor) return "";
  const limpo = valor.replace(/[^\d.,-]/g, "");

  if (limpo.includes(",")) {
    return limpo.replace(/\./g, "").replace(",", ".");
  }
  return limpo;
}

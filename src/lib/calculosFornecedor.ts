import type { RequisicaoItem, Fornecedor } from "../types/requisicao";

/** Converte string de input (que pode vir vazia, com vírgula etc.) em número seguro. */
function paraNumero(valor: string): number {
    if (!valor) return 0;
    const normalizado = valor.replace(",", ".");
    const numero = parseFloat(normalizado);
    return Number.isFinite(numero) ? numero : 0;
}

export interface ValoresItemFornecedor {
    valor: number; // valor unitário da proposta
    valorSemImpostos: number; // valor * quantidade
    valorFinal: number; // valorSemImpostos + impostos (IPI+ICMS+PIS/COFINS) - desconto
}

/**
 * Calcula os 3 valores (valor, valor sem impostos, valor final) para um item
 * considerando os dados de um fornecedor específico.
 *
 * Fórmula assumida (ajustável se a regra de negócio for diferente):
 *   valorSemImpostos = proposta × quantidade
 *   valorComImpostos  = valorSemImpostos × (1 + (IPI% + ICMS% + PIS/COFINS%) / 100)
 *   valorFinal        = valorComImpostos × (1 - desconto% / 100)
 */
export function calcularValoresItemFornecedor(
    item: RequisicaoItem,
    fornecedor: Fornecedor,
): ValoresItemFornecedor {
    const valor = paraNumero(fornecedor.proposta);
    const quantidade = paraNumero(item.quantidade);
    const valorSemImpostos = valor * quantidade;

    const percentualImpostos =
        (paraNumero(fornecedor.ipi) +
            paraNumero(fornecedor.icms) +
            paraNumero(fornecedor.pisCofins)) /
        100;
    const percentualDesconto = paraNumero(fornecedor.desconto) / 100;

    const valorComImpostos = valorSemImpostos * (1 + percentualImpostos);
    const valorFinalCalculado = valorComImpostos * (1 - percentualDesconto);

    // Se o usuário preencheu manualmente o "Valor do item", esse valor sobrescreve o calculado.
    const valorFinal = fornecedor.valorItem
        ? paraNumero(fornecedor.valorItem)
        : valorFinalCalculado;

    return { valor, valorSemImpostos, valorFinal };
}

/** Calcula o valor final SEMPRE pela fórmula automática, ignorando o valor manual (usado só como referência/sugestão). */
export function calcularValorFinalAutomatico(
    item: RequisicaoItem,
    fornecedor: Fornecedor,
): number {
    const valor = paraNumero(fornecedor.proposta);
    const quantidade = paraNumero(item.quantidade);
    const valorSemImpostos = valor * quantidade;

    const percentualImpostos =
        (paraNumero(fornecedor.ipi) +
            paraNumero(fornecedor.icms) +
            paraNumero(fornecedor.pisCofins)) /
        100;
    const percentualDesconto = paraNumero(fornecedor.desconto) / 100;

    const valorComImpostos = valorSemImpostos * (1 + percentualImpostos);
    return valorComImpostos * (1 - percentualDesconto);
}

export interface TotalPorFornecedor {
    indice: number;
    nome: string;
    quantidadeTotal: number;
    valorTotalSemImpostos: number;
    valorTotalFinal: number;
}

/**
 * Soma, para cada fornecedor (por posição), o total de quantidade e os valores
 * de todos os itens. Assume que todos os itens têm a mesma quantidade de
 * fornecedores (garantido pela sincronização já implementada no ListaRequisicoes).
 */
export function calcularTotaisPorFornecedor(
    itens: RequisicaoItem[],
): TotalPorFornecedor[] {
    if (itens.length === 0) return [];

    const quantidadeFornecedores = itens[0].fornecedores.length;

    return Array.from({ length: quantidadeFornecedores }, (_, indice) => {
        let quantidadeTotal = 0;
        let valorTotalSemImpostos = 0;
        let valorTotalFinal = 0;
        let nome = "";

        for (const item of itens) {
            const fornecedor = item.fornecedores[indice];
            if (!fornecedor) continue;
            nome = fornecedor.nome || `Fornecedor ${indice + 1}`;

            const { valorSemImpostos, valorFinal } =
                calcularValoresItemFornecedor(item, fornecedor);
            quantidadeTotal += paraNumero(item.quantidade);
            valorTotalSemImpostos += valorSemImpostos;
            valorTotalFinal += valorFinal;
        }

        return {
            indice,
            nome,
            quantidadeTotal,
            valorTotalSemImpostos,
            valorTotalFinal,
        };
    });
}

/** Retorna o índice do fornecedor com o MENOR valor total final (melhor valor). */
export function encontrarIndiceMelhorFornecedor(
    totais: TotalPorFornecedor[],
): number {
    if (totais.length === 0) return 0;
    let melhor = totais[0];
    for (const total of totais) {
        if (total.valorTotalFinal < melhor.valorTotalFinal) melhor = total;
    }
    return melhor.indice;
}

export function formatarMoeda(valor: number): string {
    return valor.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
    });
}

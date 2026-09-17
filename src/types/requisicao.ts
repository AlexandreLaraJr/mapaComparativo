export interface Fornecedor {
    id: string;
    nome: string;
    proposta: string;
    ipi: string;
    icms: string;
    pisCofins: string;
    desconto: string;
    valorItem: string; // valor final editável manualmente (sobrescreve o cálculo automático quando preenchido)
}

export interface RequisicaoItem {
    id: string;
    ordem: number; // posição sequencial do item na requisição (1, 2, 3...)
    numeroRC: string;
    numeroMaterial: string;
    textoBreve: string;
    quantidade: string;
    unidadeMedida: string;
    precoAvaliacao: string;
    fornecedores: Fornecedor[];
}

/** Cria um fornecedor vazio, com id único. */
export function criarFornecedorVazio(): Fornecedor {
    return {
        id: crypto.randomUUID(),
        nome: "",
        proposta: "",
        ipi: "",
        icms: "",
        pisCofins: "",
        desconto: "",
        valorItem: "",
    };
}

export function criarRequisicaoVazia(ordem = 1): RequisicaoItem {
    return {
        id: crypto.randomUUID(),
        ordem,
        numeroRC: "",
        numeroMaterial: "",
        textoBreve: "",
        quantidade: "",
        unidadeMedida: "",
        precoAvaliacao: "",
        fornecedores: [criarFornecedorVazio()],
    };
}

export type MotivoEscolhaFornecedor =
    | "fabricante"
    | "menor_valor"
    | "melhor_prazo";

export interface DadosConfirmacaoPdf {
    comprador: string;
    gcmNumero: string; // 3 dígitos
    fornecedorSelecionadoIndice: number;
    motivoEscolha: MotivoEscolhaFornecedor | "";
}

export function criarDadosConfirmacaoVazios(): DadosConfirmacaoPdf {
    return {
        comprador: "",
        gcmNumero: "",
        fornecedorSelecionadoIndice: 0,
        motivoEscolha: "",
    };
}

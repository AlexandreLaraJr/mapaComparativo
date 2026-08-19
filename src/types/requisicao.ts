export type TipoItem = "material" | "servico";

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
    numeroRC: string;
    tipo: TipoItem;
    quantidade: string;
    precoAvaliacao: string;
    textoBreve: string;
    numeroMaterial: string;
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
export function criarRequisicaoVazia(): RequisicaoItem {
    return {
        id: crypto.randomUUID(),
        numeroRC: "",
        tipo: "material",
        quantidade: "",
        precoAvaliacao: "",
        textoBreve: "",
        numeroMaterial: "",
        fornecedores: [criarFornecedorVazio()],
    };
}

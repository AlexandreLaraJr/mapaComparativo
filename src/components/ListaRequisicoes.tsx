import { useState } from "react";
import RequisicaoCard from "./RequisicaoCard";
import ModalConfirmacaoPdf from "./modalConfirmacaoPdf.tsx";
import type {
    RequisicaoItem,
    Fornecedor,
    DadosConfirmacaoPdf,
} from "../types/requisicao";
import {
    criarRequisicaoVazia,
    criarFornecedorVazio,
} from "../types/requisicao";
import {
    montarPdfRequisicao,
    lerRequisicoesDoPdf,
} from "../lib/pdfRequisicaoBuilder";

export default function ListaRequisicoes() {
    const [itens, setItens] = useState<RequisicaoItem[]>([
        criarRequisicaoVazia(),
    ]);
    const [gerandoPdf, setGerandoPdf] = useState(false);
    const [erro, setErro] = useState<string | null>(null);
    const [modalAberto, setModalAberto] = useState(false);

    async function handleAbrirPdf(e: React.ChangeEvent<HTMLInputElement>) {
        const arquivo = e.target.files?.[0];
        if (!arquivo) return;

        setErro(null);
        try {
            const bytes = await arquivo.arrayBuffer();
            const itensLidos = await lerRequisicoesDoPdf(bytes);
            setItens(itensLidos);
        } catch (err) {
            setErro((err as Error).message);
        } finally {
            // Limpa o input pra permitir selecionar o mesmo arquivo de novo, se precisar
            e.target.value = "";
        }
    }

    function adicionarItem() {
        setItens((atual) => {
            const novoItem = criarRequisicaoVazia();

            if (atual.length > 0) {
                // Copia os fornecedores do primeiro item já existente, mas mantendo
                // os campos sincronizados (nome, proposta, IPI, ICMS, PIS/COFINS)
                // e zerando só o desconto (que é específico de cada item).
                novoItem.fornecedores = atual[0].fornecedores.map((f) => ({
                    ...f,
                    id: crypto.randomUUID(),
                    desconto: "",
                }));
            }

            return [...atual, novoItem];
        });
    }

    function atualizarItem(itemAtualizado: RequisicaoItem) {
        setItens((atual) =>
            atual.map((item) =>
                item.id === itemAtualizado.id ? itemAtualizado : item,
            ),
        );
    }

    function removerItem(id: string) {
        setItens((atual) => atual.filter((item) => item.id !== id));
    }

    /**
     * Campos do fornecedor que ficam iguais em todos os cards (mesma posição).
     * "desconto" fica de fora de propósito — cada card mantém seu próprio valor,
     * já que o desconto pode variar por item mesmo sendo o mesmo fornecedor.
     */
    const CAMPOS_SINCRONIZADOS: (keyof Fornecedor)[] = [
        "nome",
        "proposta",
        "ipi",
        "icms",
        "pisCofins",
    ];

    /**
     * Atualiza um campo de fornecedor. Se o campo estiver na lista de sincronizados,
     * propaga o mesmo valor pro fornecedor de mesma posição em TODOS os itens.
     * Caso contrário (ex: desconto), atualiza só no item de origem.
     */
    function atualizarCampoFornecedor<K extends keyof Fornecedor>(
        itemOrigemId: string,
        indice: number,
        campo: K,
        valor: Fornecedor[K],
    ) {
        const sincronizado = CAMPOS_SINCRONIZADOS.includes(campo);

        setItens((atual) =>
            atual.map((item) => {
                if (!sincronizado && item.id !== itemOrigemId) return item;

                const fornecedores = item.fornecedores.map((f, i) =>
                    i === indice ? { ...f, [campo]: valor } : f,
                );
                return { ...item, fornecedores };
            }),
        );
    }

    /** Adiciona um novo fornecedor (vazio) em TODOS os itens ao mesmo tempo. */
    function adicionarFornecedorEmTodos() {
        setItens((atual) =>
            atual.map((item) => ({
                ...item,
                fornecedores: [...item.fornecedores, criarFornecedorVazio()],
            })),
        );
    }

    /**
     * Remove o fornecedor na posição `indice` de TODOS os itens ao mesmo tempo.
     * Usa a posição (não o id) porque cada item tem seus próprios ids de fornecedor;
     * a posição é o que "liga" o mesmo fornecedor visualmente entre os cards.
     */
    function removerFornecedorEmTodos(indice: number) {
        setItens((atual) => {
            // Trava de segurança: nunca deixa nenhum item ficar com 0 fornecedores
            const algumFicariaSemFornecedor = atual.some(
                (item) => item.fornecedores.length <= 1,
            );
            if (algumFicariaSemFornecedor) return atual;

            return atual.map((item) => ({
                ...item,
                fornecedores: item.fornecedores.filter((_, i) => i !== indice),
            }));
        });
    }

    async function handleConfirmarGeracaoPdf(
        dadosConfirmacao: DadosConfirmacaoPdf,
    ) {
        setGerandoPdf(true);
        try {
            const bytes = await montarPdfRequisicao(itens, dadosConfirmacao);
            const blob = new Blob([bytes as BlobPart], {
                type: "application/pdf",
            });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "requisicao-de-compra.pdf";
            link.click();
            URL.revokeObjectURL(url);
            setModalAberto(false);
        } finally {
            setGerandoPdf(false);
        }
    }

    return (
        <div className="flex h-screen flex-col overflow-hidden">
            {/* Cabeçalho fixo — fora da área de rolagem */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                <h1 className="text-xl font-semibold text-gray-900">
                    Itens da requisição
                </h1>
                <div className="flex items-center gap-2">
                    <label className="cursor-pointer rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                        Abrir PDF existente
                        <input
                            type="file"
                            accept=".pdf"
                            onChange={handleAbrirPdf}
                            className="hidden"
                        />
                    </label>
                    <button
                        type="button"
                        onClick={adicionarItem}
                        className="flex items-center gap-1.5 rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
                    >
                        <span className="text-lg leading-none">+</span>{" "}
                        Adicionar item
                    </button>
                    <button
                        type="button"
                        onClick={() => setModalAberto(true)}
                        className="rounded-md bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
                    >
                        Gerar PDF
                    </button>
                </div>
            </div>

            {erro && (
                <div className="mx-6 mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
                    {erro}
                </div>
            )}

            {/* Área de rolagem: ocupa todo o espaço restante da tela.
          Como fica "esticada" até o fim da viewport, a barra de rolagem
          horizontal do navegador aparece sempre grudada no rodapé real da tela. */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden px-6 py-4">
                <div className="flex h-full flex-nowrap gap-4">
                    {itens.map((item) => (
                        <div
                            key={item.id}
                            className="mt-5 w-[600px] flex-shrink-0"
                        >
                            <RequisicaoCard
                                item={item}
                                onChange={atualizarItem}
                                onRemover={() => removerItem(item.id)}
                                podeRemover={itens.length > 1}
                                onAdicionarFornecedor={
                                    adicionarFornecedorEmTodos
                                }
                                onRemoverFornecedor={removerFornecedorEmTodos}
                                onAtualizarFornecedor={atualizarCampoFornecedor}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {modalAberto && (
                <ModalConfirmacaoPdf
                    itens={itens}
                    onConfirmar={handleConfirmarGeracaoPdf}
                    onCancelar={() => setModalAberto(false)}
                />
            )}
        </div>
    );
}

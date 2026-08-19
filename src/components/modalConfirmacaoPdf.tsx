import { useMemo, useState } from "react";
import type {
    RequisicaoItem,
    DadosConfirmacaoPdf,
    MotivoEscolhaFornecedor,
} from "../types/requisicao";
import {
    calcularTotaisPorFornecedor,
    encontrarIndiceMelhorFornecedor,
    formatarMoeda,
} from "../lib/calculosFornecedor";

interface ModalConfirmacaoPdfProps {
    itens: RequisicaoItem[];
    onConfirmar: (dados: DadosConfirmacaoPdf) => void;
    onCancelar: () => void;
}

const MOTIVOS: { value: MotivoEscolhaFornecedor; label: string }[] = [
    { value: "fabricante", label: "Fabricante" },
    { value: "menor_valor", label: "Menor valor" },
    { value: "melhor_prazo", label: "Melhor prazo" },
];

export default function ModalConfirmacaoPdf({
    itens,
    onConfirmar,
    onCancelar,
}: ModalConfirmacaoPdfProps) {
    const totais = useMemo(() => calcularTotaisPorFornecedor(itens), [itens]);
    const indiceMelhor = useMemo(
        () => encontrarIndiceMelhorFornecedor(totais),
        [totais],
    );

    const [comprador, setComprador] = useState("");
    const [gcmNumero, setGcmNumero] = useState("");
    const [fornecedorSelecionadoIndice, setFornecedorSelecionadoIndice] =
        useState(indiceMelhor);
    const [motivoEscolha, setMotivoEscolha] = useState<
        MotivoEscolhaFornecedor | ""
    >("");

    const dataHoje = new Date().toLocaleDateString("pt-BR");

    const gcmValido = /^\d{3}$/.test(gcmNumero);
    const formularioValido =
        comprador.trim().length > 0 && gcmValido && motivoEscolha !== "";

    function handleConfirmar() {
        if (!formularioValido) return;
        onConfirmar({
            comprador: comprador.trim(),
            gcmNumero,
            fornecedorSelecionadoIndice,
            motivoEscolha,
        });
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
                <h2 className="mb-1 text-lg font-semibold text-gray-900">
                    Confirmar geração do PDF
                </h2>
                <p className="mb-5 text-sm text-gray-500">
                    Data: {dataHoje} (preenchida automaticamente)
                </p>

                <div className="mb-5 flex flex-wrap gap-4">
                    <div className="w-full sm:w-[calc(50%-0.5rem)]">
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Comprador
                        </label>
                        <input
                            type="text"
                            value={comprador}
                            onChange={(e) => setComprador(e.target.value)}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                            placeholder="Nome do comprador"
                        />
                    </div>

                    <div className="w-full sm:w-[calc(50%-0.5rem)]">
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            GCm <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={gcmNumero}
                            onChange={(e) =>
                                setGcmNumero(
                                    e.target.value
                                        .replace(/\D/g, "")
                                        .slice(0, 3),
                                )
                            }
                            className="w-24 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                            placeholder="000"
                            maxLength={3}
                        />
                        {!gcmValido && gcmNumero && (
                            <p className="mt-1 text-xs text-red-500">
                                Informe os 3 dígitos do GCm.
                            </p>
                        )}
                    </div>
                </div>

                <div className="mb-5">
                    <h3 className="mb-2 text-sm font-semibold text-gray-800">
                        Comparação entre fornecedores
                    </h3>
                    <div className="overflow-hidden rounded-md border border-gray-200">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-left text-xs text-gray-500">
                                <tr>
                                    <th className="px-3 py-2">Fornecedor</th>
                                    <th className="px-3 py-2">Qtd. total</th>
                                    <th className="px-3 py-2">
                                        Valor total final
                                    </th>
                                    <th className="px-3 py-2"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {totais.map((total) => (
                                    <tr
                                        key={total.indice}
                                        className={
                                            total.indice === indiceMelhor
                                                ? "bg-green-50"
                                                : ""
                                        }
                                    >
                                        <td className="px-3 py-2 font-medium text-gray-800">
                                            {total.nome ||
                                                `Fornecedor ${total.indice + 1}`}
                                        </td>
                                        <td className="px-3 py-2 text-gray-600">
                                            {total.quantidadeTotal}
                                        </td>
                                        <td className="px-3 py-2 text-gray-600">
                                            {formatarMoeda(
                                                total.valorTotalFinal,
                                            )}
                                        </td>
                                        <td className="px-3 py-2">
                                            {total.indice === indiceMelhor && (
                                                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                                                    Melhor valor
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="mb-6 flex flex-wrap gap-4">
                    <div className="w-full sm:w-[calc(50%-0.5rem)]">
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Fornecedor selecionado para o PDF
                        </label>
                        <select
                            value={fornecedorSelecionadoIndice}
                            onChange={(e) =>
                                setFornecedorSelecionadoIndice(
                                    Number(e.target.value),
                                )
                            }
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                        >
                            {totais.map((total) => (
                                <option key={total.indice} value={total.indice}>
                                    {total.nome ||
                                        `Fornecedor ${total.indice + 1}`}
                                    {total.indice === indiceMelhor
                                        ? " (melhor valor)"
                                        : ""}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="w-full sm:w-[calc(50%-0.5rem)]">
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Motivo da escolha{" "}
                            <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={motivoEscolha}
                            onChange={(e) =>
                                setMotivoEscolha(
                                    e.target.value as MotivoEscolhaFornecedor,
                                )
                            }
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                        >
                            <option value="" disabled>
                                Selecione...
                            </option>
                            {MOTIVOS.map((motivo) => (
                                <option key={motivo.value} value={motivo.value}>
                                    {motivo.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onCancelar}
                        className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirmar}
                        disabled={!formularioValido}
                        className="rounded-md bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Gerar PDF
                    </button>
                </div>
            </div>
        </div>
    );
}

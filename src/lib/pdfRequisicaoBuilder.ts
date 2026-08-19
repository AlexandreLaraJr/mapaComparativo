import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type {
    PDFPage,
    PDFFont,
    PDFForm,
    PDFDocument as PDFDocumentType,
} from "pdf-lib";
import type {
    RequisicaoItem,
    Fornecedor,
    TipoItem,
    DadosConfirmacaoPdf,
} from "../types/requisicao";
import {
    calcularValoresItemFornecedor,
    calcularTotaisPorFornecedor,
    encontrarIndiceMelhorFornecedor,
    formatarMoeda,
} from "./calculosFornecedor";

const LARGURA_PAGINA = 842; // A4 retrato (vertical)
const ALTURA_PAGINA = 595;
const MARGEM = 30;
const ALTURA_LINHA = 16;
const TAMANHO_FONTE = 7;
const TAMANHO_FONTE_TITULO = 16;

const NOME_EMPRESA = "Empresa"; // troque pelo nome real da empresa quando tiver

function nomeCampoItem(indiceItem: number, chave: string): string {
    return `item_${indiceItem}_${chave}`;
}
function nomeCampoFornecedor(
    indiceItem: number,
    indiceFornecedor: number,
    chave: string,
): string {
    return `item_${indiceItem}_fornecedor_${indiceFornecedor}_${chave}`;
}

interface EstadoDesenho {
    pdfDoc: PDFDocumentType;
    page: PDFPage;
    y: number;
    fonte: PDFFont;
    fonteNegrito: PDFFont;
    form: PDFForm;
}

export async function montarPdfRequisicao(
    itens: RequisicaoItem[],
    confirmacao: DadosConfirmacaoPdf,
): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const fonte = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fonteNegrito = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const form = pdfDoc.getForm();

    const estado: EstadoDesenho = {
        pdfDoc,
        page: pdfDoc.addPage([LARGURA_PAGINA, ALTURA_PAGINA]),
        y: 0,
        fonte,
        fonteNegrito,
        form,
    };

    estado.y = desenharCabecalho(estado.page, fonteNegrito, fonte, confirmacao);
    estado.y = desenharSecaoComparacao(estado, itens, confirmacao);
    estado.y -= 20;

    desenharMatrizItens(estado, itens);

    form.getFields().forEach((campo) => campo.enableReadOnly());
    return pdfDoc.save();
}

/** ---- Cabeçalho: verde (empresa) + laranja (comprador/data/GCm) ---- */
function desenharCabecalho(
    page: PDFPage,
    fonteNegrito: PDFFont,
    fonte: PDFFont,
    confirmacao: DadosConfirmacaoPdf,
): number {
    // Verde: nome da empresa
    page.drawText(NOME_EMPRESA, {
        x: MARGEM,
        y: ALTURA_PAGINA - 40,
        size: TAMANHO_FONTE_TITULO,
        font: fonteNegrito,
        color: rgb(0.1, 0.1, 0.1),
    });

    // Laranja: comprador, data, GCm — alinhado à direita
    const dataHoje = new Date().toLocaleDateString("pt-BR");
    const linhasCabecalhoDireita = [
        `Comprador: ${confirmacao.comprador}`,
        `Data: ${dataHoje}`,
        `GCm: ${confirmacao.gcmNumero}`,
    ];

    linhasCabecalhoDireita.forEach((linha, indice) => {
        const largura = fonte.widthOfTextAtSize(linha, 10);
        page.drawText(linha, {
            x: LARGURA_PAGINA - MARGEM - largura,
            y: ALTURA_PAGINA - 30 - indice * 14,
            size: 10,
            font: fonte,
            color: rgb(0.25, 0.25, 0.25),
        });
    });

    page.drawLine({
        start: { x: MARGEM, y: ALTURA_PAGINA - 62 },
        end: { x: LARGURA_PAGINA - MARGEM, y: ALTURA_PAGINA - 62 },
        thickness: 1,
        color: rgb(0.75, 0.75, 0.75),
    });

    return ALTURA_PAGINA - 90;
}

/** ---- Vermelho: comparação entre fornecedores, destacando o melhor e o selecionado ---- */
function desenharSecaoComparacao(
    estado: EstadoDesenho,
    itens: RequisicaoItem[],
    confirmacao: DadosConfirmacaoPdf,
): number {
    const { page, fonteNegrito, fonte } = estado;
    let y = estado.y;

    page.drawText("Comparação entre fornecedores", {
        x: MARGEM,
        y,
        size: 11,
        font: fonteNegrito,
    });
    y -= 20;

    const totais = calcularTotaisPorFornecedor(itens);
    const indiceMelhor = encontrarIndiceMelhorFornecedor(totais);

    const colunas = [
        { titulo: "Fornecedor", largura: 150 },
        { titulo: "Qtd. total", largura: 60 },
        { titulo: "Valor total final", largura: 100 },
        { titulo: "Observação", largura: 165 },
    ];

    let x = MARGEM;
    for (const coluna of colunas) {
        page.drawText(coluna.titulo, {
            x,
            y,
            size: TAMANHO_FONTE,
            font: fonteNegrito,
            color: rgb(0.4, 0.4, 0.4),
        });
        x += coluna.largura;
    }
    y -= ALTURA_LINHA;

    const motivoLabel: Record<string, string> = {
        fabricante: "Fabricante",
        menor_valor: "Menor valor",
        melhor_prazo: "Melhor prazo",
    };

    for (const total of totais) {
        const ehMelhor = total.indice === indiceMelhor;
        const ehSelecionado =
            total.indice === confirmacao.fornecedorSelecionadoIndice;

        if (ehMelhor) {
            page.drawRectangle({
                x: MARGEM - 4,
                y: y - 4,
                width: colunas.reduce((soma, c) => soma + c.largura, 0),
                height: ALTURA_LINHA,
                color: rgb(0.91, 0.98, 0.92),
            });
        }

        let xLinha = MARGEM;
        const nome = total.nome || `Fornecedor ${total.indice + 1}`;
        page.drawText(nome, {
            x: xLinha,
            y,
            size: TAMANHO_FONTE,
            font: fonte,
            color: rgb(0.15, 0.15, 0.15),
        });
        xLinha += colunas[0].largura;

        page.drawText(String(total.quantidadeTotal), {
            x: xLinha,
            y,
            size: TAMANHO_FONTE,
            font: fonte,
        });
        xLinha += colunas[1].largura;

        page.drawText(formatarMoeda(total.valorTotalFinal), {
            x: xLinha,
            y,
            size: TAMANHO_FONTE,
            font: fonte,
        });
        xLinha += colunas[2].largura;

        const observacoes: string[] = [];
        if (ehMelhor) observacoes.push("Melhor valor");
        if (ehSelecionado)
            observacoes.push(
                `Selecionado (${motivoLabel[confirmacao.motivoEscolha] ?? confirmacao.motivoEscolha})`,
            );
        page.drawText(observacoes.join(" · "), {
            x: xLinha,
            y,
            size: TAMANHO_FONTE,
            font: fonteNegrito,
            color: rgb(0.1, 0.5, 0.2),
        });

        y -= ALTURA_LINHA;
    }

    return y;
}

/** ---- Azul: matriz com 1 item por linha, colunas repetidas por fornecedor ---- */
function desenharMatrizItens(estado: EstadoDesenho, itens: RequisicaoItem[]) {
    const quantidadeFornecedores =
        itens.length > 0 ? itens[0].fornecedores.length : 0;

    const LARGURA_ITEM = {
        numeroRC: 40,
        numeroMaterial: 40,
        textoBreve: 85,
        quantidade: 25,
    };
    const LARGURA_SUBCOLUNA_FORNECEDOR = 38; // cada fornecedor tem 3 subcolunas desse tamanho

    function novaPagina() {
        estado.page = estado.pdfDoc.addPage([LARGURA_PAGINA, ALTURA_PAGINA]);
        estado.y = ALTURA_PAGINA - 50;
        estado.y = desenharCabecalhoMatriz(
            estado,
            itens,
            LARGURA_ITEM,
            LARGURA_SUBCOLUNA_FORNECEDOR,
            quantidadeFornecedores,
        );
    }

    function garantirEspaco(alturaNecessaria: number) {
        if (estado.y - alturaNecessaria < MARGEM) {
            novaPagina();
        }
    }

    estado.y = desenharCabecalhoMatriz(
        estado,
        itens,
        LARGURA_ITEM,
        LARGURA_SUBCOLUNA_FORNECEDOR,
        quantidadeFornecedores,
    );

    itens.forEach((item, indiceItem) => {
        garantirEspaco(ALTURA_LINHA);

        let x = MARGEM;
        const campos: { chave: string; largura: number; valor: string }[] = [
            {
                chave: "numeroRC",
                largura: LARGURA_ITEM.numeroRC,
                valor: item.numeroRC,
            },
            {
                chave: "numeroMaterial",
                largura: LARGURA_ITEM.numeroMaterial,
                valor:
                    item.tipo === "material" ? item.numeroMaterial : "Serviço",
            },
            {
                chave: "textoBreve",
                largura: LARGURA_ITEM.textoBreve,
                valor: item.textoBreve,
            },
            {
                chave: "quantidade",
                largura: LARGURA_ITEM.quantidade,
                valor: item.quantidade,
            },
        ];

        for (const campo of campos) {
            const fieldForm = estado.form.createTextField(
                nomeCampoItem(indiceItem, campo.chave),
            );
            fieldForm.setText(campo.valor || "-");
            fieldForm.addToPage(estado.page, {
                x,
                y: estado.y - 3,
                width: campo.largura - 3,
                height: ALTURA_LINHA - 3,
                font: estado.fonte,
                textColor: rgb(0.15, 0.15, 0.15),
            });
            x += campo.largura;
        }

        // Campo oculto guardando o tipo (material/serviço), necessário pra releitura correta
        const campoTipo = estado.form.createTextField(
            nomeCampoItem(indiceItem, "tipo"),
        );
        campoTipo.setText(item.tipo === "material" ? "Material" : "Serviço");
        campoTipo.addToPage(estado.page, {
            x: -1000,
            y: -1000,
            width: 1,
            height: 1,
        }); // fora da área visível

        item.fornecedores.forEach((fornecedor, indiceFornecedor) => {
            const { valor, valorSemImpostos, valorFinal } =
                calcularValoresItemFornecedor(item, fornecedor);

            const subcampos = [
                { chave: "proposta", valor: formatarMoeda(valor) },
                {
                    chave: "valorSemImpostos",
                    valor: formatarMoeda(valorSemImpostos),
                },
                { chave: "valorFinal", valor: formatarMoeda(valorFinal) },
            ];

            subcampos.forEach((sub) => {
                const campo = estado.form.createTextField(
                    nomeCampoFornecedor(
                        indiceItem,
                        indiceFornecedor,
                        sub.chave,
                    ),
                );
                campo.setText(sub.valor);
                campo.addToPage(estado.page, {
                    x,
                    y: estado.y - 3,
                    width: LARGURA_SUBCOLUNA_FORNECEDOR - 3,
                    height: ALTURA_LINHA - 3,
                    font: estado.fonte,
                    textColor: rgb(0.2, 0.2, 0.2),
                });
                x += LARGURA_SUBCOLUNA_FORNECEDOR;
            });

            // Campos ocultos com os dados brutos do fornecedor (pra reconstrução fiel ao reabrir).
            // "propostaBruta" usa sufixo diferente do campo visível "proposta" (que guarda o valor já formatado em moeda).
            const camposOcultos: { chave: string; valor: string }[] = [
                { chave: "nome", valor: fornecedor.nome },
                { chave: "propostaBruta", valor: fornecedor.proposta },
                { chave: "ipi", valor: fornecedor.ipi },
                { chave: "icms", valor: fornecedor.icms },
                { chave: "pisCofins", valor: fornecedor.pisCofins },
                { chave: "desconto", valor: fornecedor.desconto },
                { chave: "valorItem", valor: fornecedor.valorItem },
            ];
            camposOcultos.forEach(({ chave, valor }) => {
                const campoOculto = estado.form.createTextField(
                    nomeCampoFornecedor(indiceItem, indiceFornecedor, chave),
                );
                campoOculto.setText(valor || "");
                campoOculto.addToPage(estado.page, {
                    x: -1000,
                    y: -1000,
                    width: 1,
                    height: 1,
                });
            });
        });

        estado.y -= ALTURA_LINHA;
    });
}

function desenharCabecalhoMatriz(
    estado: EstadoDesenho,
    itens: RequisicaoItem[],
    larguraItem: {
        numeroRC: number;
        numeroMaterial: number;
        textoBreve: number;
        quantidade: number;
    },
    larguraSubcoluna: number,
    quantidadeFornecedores: number,
): number {
    const { page, fonteNegrito } = estado;
    let y = estado.y;

    page.drawText("Itens da requisição", {
        x: MARGEM,
        y,
        size: 11,
        font: fonteNegrito,
    });
    y -= 18;

    let x = MARGEM;
    const titulosItem = [
        { titulo: "Nº RC", largura: larguraItem.numeroRC },
        { titulo: "Nº Material", largura: larguraItem.numeroMaterial },
        { titulo: "Item", largura: larguraItem.textoBreve },
        { titulo: "Qtd.", largura: larguraItem.quantidade },
    ];
    for (const t of titulosItem) {
        page.drawText(t.titulo, {
            x,
            y,
            size: TAMANHO_FONTE,
            font: fonteNegrito,
        });
        x += t.largura;
    }

    const nomesFornecedores =
        itens.length > 0
            ? itens[0].fornecedores.map(
                  (f, i) => f.nome || `Fornecedor ${i + 1}`,
              )
            : [];
    for (let i = 0; i < quantidadeFornecedores; i++) {
        const larguraBloco = larguraSubcoluna * 3;
        const nome = nomesFornecedores[i] ?? `Fornecedor ${i + 1}`;
        page.drawText(nome, {
            x,
            y,
            size: TAMANHO_FONTE,
            font: fonteNegrito,
            color: rgb(0.3, 0.3, 0.3),
        });
        x += larguraBloco;
    }
    y -= 12;

    x =
        MARGEM +
        larguraItem.numeroRC +
        larguraItem.numeroMaterial +
        larguraItem.textoBreve +
        larguraItem.quantidade;
    for (let i = 0; i < quantidadeFornecedores; i++) {
        const subtitulos = ["Valor", "S/Imp", "Final"];
        for (const sub of subtitulos) {
            page.drawText(sub, {
                x,
                y,
                size: 6,
                font: estado.fonte,
                color: rgb(0.5, 0.5, 0.5),
            });
            x += larguraSubcoluna;
        }
    }

    return y - ALTURA_LINHA;
}

/**
 * Lê um PDF gerado por este sistema e reconstrói a lista de itens
 * (não reconstrói os dados de confirmação — comprador/GCm/motivo — que
 * são específicos daquela geração e não fazem parte do que se edita depois).
 */
export async function lerRequisicoesDoPdf(
    bytes: ArrayBuffer,
): Promise<RequisicaoItem[]> {
    const pdfDoc = await PDFDocument.load(bytes);
    const form = pdfDoc.getForm();
    const campos = form.getFields();

    const indicesItem = new Set<number>();
    const indicesFornecedorPorItem = new Map<number, Set<number>>();

    for (const campo of campos) {
        const nome = campo.getName();

        const combFornecedor = nome.match(/^item_(\d+)_fornecedor_(\d+)_/);
        if (combFornecedor) {
            const indiceItem = Number(combFornecedor[1]);
            const indiceFornecedor = Number(combFornecedor[2]);
            indicesItem.add(indiceItem);
            if (!indicesFornecedorPorItem.has(indiceItem))
                indicesFornecedorPorItem.set(indiceItem, new Set());
            indicesFornecedorPorItem.get(indiceItem)!.add(indiceFornecedor);
            continue;
        }

        const combItem = nome.match(/^item_(\d+)_/);
        if (combItem) indicesItem.add(Number(combItem[1]));
    }

    if (indicesItem.size === 0) {
        throw new Error(
            "Este PDF não parece ter sido gerado por este sistema.",
        );
    }

    const lerCampo = (nomeCampo: string): string => {
        try {
            return form.getTextField(nomeCampo).getText() ?? "";
        } catch {
            return "";
        }
    };

    const indicesOrdenados = Array.from(indicesItem).sort((a, b) => a - b);

    return indicesOrdenados.map((indiceItem) => {
        const tipoTexto = lerCampo(nomeCampoItem(indiceItem, "tipo"));
        const tipo: TipoItem =
            tipoTexto === "Material" ? "material" : "servico";

        const indicesFornecedor = Array.from(
            indicesFornecedorPorItem.get(indiceItem) ?? [],
        ).sort((a, b) => a - b);

        const fornecedores: Fornecedor[] = indicesFornecedor.map(
            (indiceFornecedor) => ({
                id: crypto.randomUUID(),
                nome: lerCampo(
                    nomeCampoFornecedor(indiceItem, indiceFornecedor, "nome"),
                ),
                proposta: lerCampo(
                    nomeCampoFornecedor(
                        indiceItem,
                        indiceFornecedor,
                        "propostaBruta",
                    ),
                ),
                ipi: lerCampo(
                    nomeCampoFornecedor(indiceItem, indiceFornecedor, "ipi"),
                ),
                icms: lerCampo(
                    nomeCampoFornecedor(indiceItem, indiceFornecedor, "icms"),
                ),
                pisCofins: lerCampo(
                    nomeCampoFornecedor(
                        indiceItem,
                        indiceFornecedor,
                        "pisCofins",
                    ),
                ),
                desconto: lerCampo(
                    nomeCampoFornecedor(
                        indiceItem,
                        indiceFornecedor,
                        "desconto",
                    ),
                ),
                valorItem: lerCampo(
                    nomeCampoFornecedor(
                        indiceItem,
                        indiceFornecedor,
                        "valorItem",
                    ),
                ),
            }),
        );

        return {
            id: crypto.randomUUID(),
            numeroRC: lerCampo(nomeCampoItem(indiceItem, "numeroRC")),
            tipo,
            quantidade: lerCampo(nomeCampoItem(indiceItem, "quantidade")),
            precoAvaliacao: "",
            textoBreve: lerCampo(nomeCampoItem(indiceItem, "textoBreve")),
            numeroMaterial:
                tipo === "material"
                    ? lerCampo(nomeCampoItem(indiceItem, "numeroMaterial"))
                    : "",
            fornecedores:
                fornecedores.length > 0
                    ? fornecedores
                    : [
                          {
                              id: crypto.randomUUID(),
                              nome: "",
                              proposta: "",
                              ipi: "",
                              icms: "",
                              pisCofins: "",
                              desconto: "",
                              valorItem: "",
                          },
                      ],
        };
    });
}

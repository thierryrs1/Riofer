class customAPP {
  constructor() {
    // Configurações centralizadas — limites/tolerâncias do terminal.
    // Alterar aqui propaga para todos os pontos que consultam this.config.
    this.config = {
      LIMITE_VARIACAO_PESO: 0.07,        // 5% — bloqueia salvar se peso unit divergir > 5% do teórico
      LIMITE_PERDA_CONFIRMACAO: 0.07,    // 5% — pede confirmação se perda > 5% no salvar
      MARGEM_KG_RESIDUAL: 5,             // 5kg — ajuste residual ao finalizar (linha do AJUSTE RESIDUAL)
      HISTORICO_MAX_REGISTROS: 5,        // últimos N apontamentos a exibir na tela
      TEMPO_MINIMO_APTO_SEG: 300,         // tempo mínimo (em segundos) entre o início da OP e o apontamento
    };

    this.getEmployeRules().then((res) => {
      this.app_dataClear();
      this.generateViews(res);
      this.gui();
    });
  }

  app_dataClear() {
    this.appData = {
      bloqTabApto: false,
      lotesSelecionados: [],
      procAuxParam: [],
      op: 0,
      pos: 0,
      operacao: 0,
      pesopc: 0,
      buchnid: 0,
      interrupReasons: [],
      lotesReservados: [],
      planocorte: [],
      dimensoes: [],
      angulos: [],
      listaOps: [],
      lotesEtiq: [],
      contLote: [],
      opAtual: [],
      impressora: [],
      aptoAtivo: 0,
      recursoAtivo: '',
      retDeletaApto: [],
      historicoApto: [],   // últimos apontamentos da OP corrente (carregado via GetHistoricoApontamentos)
    };

    ux.set("appSave", "disabled");

  }

  async getEmployeRules() {
    ux.aget(
      "?program_id=" +
      appInfo.gid +
      "&page=" +
      appInfo.appID +
      "&get=ProcAux&acao=getemployerules&belnr=0&belpos=0&pos=0&param1=" +
      appInfo.uid +
      "&dg_limit=999",
      function (err, result) {
        if (!err && result.hasOwnProperty("value") && result.value.length > 0) {
          this.employerules = result.value;
        } else {
          this.employerules = [[""]];
        }
      }.bind(this)
    );
    await ux.wait();
    return await Promise.resolve(false);
  }

  generateViews(res) {
    this.viewButtons = [];
    this.generateGridButton();
    this.generateViewButton();
  }

  returnGridDesbobinador() {
    let gridOutros = {
      name: "DESBOBINADOR",
      grid: [
        [
          { title: _t("Início") },
          { title: _t("Previsto (min)") },
          { title: _t("OP") },
          { title: _t("Descrição do Item") },
          { title: _t("Qtd. Chapas") },
          { title: _t("Peso Total Chapas") },
          { title: _t("Produzido") },
          { title: _t("") },
        ],
        function (tbody, rid, dr) {
          let row, cell, i;
          row = tbody.insertRow(-1);
          row.setAttribute("data-rid", rid);
          if (dr[32] != '' && dr[32] != null) {
            row.setAttribute("style", "background-color:#f4998d");
          } else {
            row.setAttribute("style", "background-color:#FFFFFF");
          }
          i = 0;

          //Data Inicio
          cell = row.insertCell(i++);
          cell.innerHTML = dr[37];
          cell.setAttribute("onClick", "app.pararApontamento(" + rid + ")");

          //Tempo Previsto
          cell = row.insertCell(i++);
          cell.innerHTML = parseInt(dr[39]);
          cell.setAttribute("onClick", "app.pararApontamento(" + rid + ")");

          //OP
          cell = row.insertCell(i++);
          cell.innerHTML = dr[3];
          cell.setAttribute("onClick", "app.pararApontamento(" + rid + ")");

          //Item
          cell = row.insertCell(i++);
          cell.innerHTML = dr[6];
          cell.setAttribute("onClick", "app.pararApontamento(" + rid + ")");

          //Qtd. Chapas
          cell = row.insertCell(i++);
          cell.innerHTML = Math.round(dr[26]);
          //cell.innerHTML = Math.round(parseFloat(dr[19]) / parseFloat(dr[24]));
          cell.setAttribute("onClick", "app.pararApontamento(" + rid + ")");

          //Peso Total Chapas
          cell = row.insertCell(i++);
          cell.innerHTML = Math.round(dr[19], 2);
          cell.setAttribute("onClick", "app.pararApontamento(" + rid + ")");

          //Produzido
          cell = row.insertCell(i++);
          cell.innerHTML = dr[8];
          cell.setAttribute("onClick", "app.pararApontamento(" + rid + ")");

          //Botoes
          let htmlBotoes, htmlBtLote = "";
          cell = row.insertCell(i++);

          if (rid == 0) {
            app.appData.aptoAtivo = dr[11]
            app.appData.recursoAtivo = dr[14]
          }

          if (dr[18] != "" && dr[18] != undefined) {
            htmlBtLote =
              `<td>
                <a href="#" onclick="app.getInfoLotes('${dr[18]}')"> 
                  <img src="./assets21/img/msg-info.png" height=40px width=40px style="margin:0px 5%">
                  </img>
                </a>
              </td>
            <td>`
          }

          if (dr[11] != "" && dr[11] != undefined) {
            htmlBotoes = `
            <center>
              <b>${dr[16]}</b>
              <br>
                ${htmlBtLote}
                <a href="#" onclick="app.stopOrder(${dr[11]}, 'stop')"> 
                  <img src="./assets21/img/msg-error.png" height=40px width=40px style="margin:0px 5%">
                  </img>
                </a>
              </td>
              <td>
                <a href="#" onclick="app.initApto('${dr[18]}', ${dr[20]}, ${dr[11]}, ${dr[25]}, ${dr[27]}, '${dr[3]}', ${dr[23]})">
                  <img src="./assets21/img/msg-ok.png" height=40px width=40px style="margin:0px 5%">
                  </img>
                </a>
              </td>
              <td>
                <a href="#" onclick="app.eventInterruption('${app.appData.recurso}','${dr[17]}' )">
                  <img src="./assets21/img/stillstand.png" height=40px width=40px style="margin:0px 5%">
                  </img>
                </a>
              </td>`

            if (app.appData.recurso != dr[14]) {
              htmlBotoes += `<td>
                <a href="#" onclick="app.startOrder(${dr[0]},${dr[1]},${dr[2]})"> 
                  <img src="./assets21/img/app_t20_wostart.png" height=40px width=40px style="margin:0px 5%">
                  </img>
                </a>
              </td>`
            }

            if (dr[30] != null) {
              htmlBotoes +=
                `<td>
                  <a href="#" onclick="app.geraTabLotesEtiq('${dr[30]}', '${dr[3]}', 0, '${dr[1]}')"> 
                    <img src="./assets21/img/printer.png" height=40px width=40px style="margin:0px 5%">
                    </img>
                  </a>
                </td>`
            }
            htmlBotoes += '<br>' + (dr[32] == undefined ? '' : dr[32]) + `</center>`;
          } else {
            htmlBotoes = `<center> ${htmlBtLote}`

            if (((app.appData.aptoAtivo || 0) == 0) || ((app.appData.aptoAtivo || 0) != 0 && app.appData.recurso != app.appData.recursoAtivo)) {
              htmlBotoes +=
                `<td>
                    <a href="#" onclick="app.startOrder(${dr[0]},${dr[1]},${dr[2]})"> 
                      <img src="./assets21/img/app_t20_wostart.png" height=40px width=40px style="margin:0px 5%">
                      </img>
                    </a>
                  </td>`
            }

            if (dr[30] != null) {
              htmlBotoes +=
                `<td>
                    <a href="#" onclick="app.geraTabLotesEtiq('${dr[30]}', '${dr[3]}', 0, '${dr[1]}')"> 
                      <img src="./assets21/img/printer.png" height=40px width=40px style="margin:0px 5%">
                      </img>
                    </a>
                  </td>`
            }

            htmlBotoes += '<br>' + (dr[32] == undefined ? '' : dr[32]) + `</center>`;
          }
          cell.innerHTML = htmlBotoes;
        },
      ],
    };

    return gridOutros
  }

  returnGridGuilhotina() {
    let cor = '#FFFFFF'
    let nr = ''
    app.appData.planocorte = []

    let gridOutros = {
      name: "GUILHOTINAS",
      grid: [
        [
          { title: _t("Início") },
          { title: _t("Previsto (min)") },
          { title: _t("OP") },
          { title: _t("NR") },
          { title: _t("Desenho") },
          { title: _t("Descrição do Item") },
          { title: _t("Plano Corte") },
          { title: _t("Quant. Chapas") },
          { title: _t("Quant. Blank") },
          { title: _t("Chapas Prod.") },
          { title: _t("") },
        ],
        function (tbody, rid, dr) {
          let row, cell, i;
          row = tbody.insertRow(-1);
          row.setAttribute("data-rid", rid);
          i = 0;

          if (dr[23] != nr) {
            cor = cor == "#ADD8E6" ? "#FFFFFF" : "#ADD8E6"
            nr = dr[23]
          }

          if (dr[32] != '' && dr[32] != null) {
            row.setAttribute("style", "background-color:#f4998d");
          } else {
            row.setAttribute("style", `background-color:${cor}`);
          }

          //Data Inicio
          cell = row.insertCell(i++);
          cell.innerHTML = dr[37];
          cell.setAttribute("onClick", "app.pararApontamento(" + rid + ")");

          //Tempo Previsto
          cell = row.insertCell(i++);
          cell.innerHTML = parseInt(dr[39]);
          cell.setAttribute("onClick", "app.pararApontamento(" + rid + ")");

          //OP
          cell = row.insertCell(i++);
          cell.innerHTML = dr[3];
          cell.setAttribute("onClick", "app.pararApontamento(" + rid + ")");

          //NR
          cell = row.insertCell(i++);
          cell.innerHTML = dr[23];

          //desenho
          /* app.appData.planocorte.push([dr[3], dr[29]])
           cell = row.insertCell(i++);
           cell.innerHTML = `<img width="64" height="64" src="${dr[5]}"
                           onClick="app.geraDesGuilhotina('${dr[3]}','${dr[5]}')"
                          >` onError="this.src='assets21//img//app_t20_extGRPO.png'"
                           <img width="64" height="64" src="${dr[5]}"
                           onClick="app.imageDialog('${dr[5]}')"
                           onError="this.src='assets21//img//wbb.png'"
                           ><br>`;*/

          app.appData.planocorte.push([dr[3], dr[29]]);
          cell = row.insertCell(i++);
          cell.innerHTML = `
            <img 
            width="64" 
            height="64" 
            src="${dr[5]}"
            onClick="app.geraDesGuilhotina('${dr[3]}', '${dr[5]}')" 
            onError="this.src='assets21/img/app_t20_extGRPO.png'; this.onerror = null"
            >
            
            <br>
          `;

          //Item
          cell = row.insertCell(i++);
          cell.innerHTML = dr[6];
          cell.setAttribute("onClick", "app.pararApontamento(" + rid + ")");

          //Plano de Corte
          cell = row.insertCell(i++);
          cell.innerHTML = dr[25];
          cell.setAttribute("onClick", "app.pararApontamento(" + rid + ")");

          //Quantidade Chapas
          cell = row.insertCell(i++);
          cell.innerHTML = dr[26];
          cell.setAttribute("onClick", "app.pararApontamento(" + rid + ")");

          //Quantidade de Blank
          cell = row.insertCell(i++);
          cell.innerHTML = dr[25] * dr[26];
          cell.setAttribute("onClick", "app.pararApontamento(" + rid + ")");

          //Produzido
          cell = row.insertCell(i++);
          cell.innerHTML = dr[31];
          cell.setAttribute("onClick", "app.pararApontamento(" + rid + ")");

          //Botoes
          let htmlBotoes, htmlBtLote = "";
          cell = row.insertCell(i++);

          if (rid == 0) {
            app.appData.aptoAtivo = dr[11]
            app.appData.recursoAtivo = dr[14]
          }

          if (dr[18] != "" && dr[18] != undefined) {
            htmlBtLote =
              `<td>
                <a href="#" onclick="app.getInfoLotes('${dr[18]}')"> 
                  <img src="./assets21/img/msg-info.png" height=40px width=40px style="margin:0px 5%">
                  </img>
                </a>
              </td>
            <td>`
          }

          if (dr[11] != "" && dr[11] != undefined) {
            htmlBotoes = `
            <center>
              <b>${dr[16]}</b>
              <br>
                ${htmlBtLote}
                <a href="#" onclick="app.stopOrder(${dr[11]}, 'stop')"> 
                  <img src="./assets21/img/msg-error.png" height=40px width=40px style="margin:0px 5%">
                  </img>
                </a>
              </td>
              <td>
                <a href="#" onclick="app.initApto('${dr[18]}', ${dr[20]}, ${dr[11]}, ${dr[25]}, ${dr[27]}, '${dr[3]}', ${dr[23]})">
                  <img src="./assets21/img/msg-ok.png" height=40px width=40px style="margin:0px 5%">
                  </img>
                </a>
              </td>
              <td>
                <a href="#" onclick="app.eventInterruption('${app.appData.recurso}','${dr[17]}' )">
                  <img src="./assets21/img/stillstand.png" height=40px width=40px style="margin:0px 5%">
                  </img>
                </a>
              </td>`
            if (app.appData.recurso != dr[14]) {
              htmlBotoes += `
                <td>
                  <a href="#" onclick="app.startOrder(${dr[0]},${dr[1]},${dr[2]})"> 
                    <img src="./assets21/img/app_t20_wostart.png" height=40px width=40px style="margin:0px 5%">
                    </img>
                  </a>
                </td>`
            }

            if (dr[30] != null) {
              htmlBotoes +=
                `<td>
                    <a href="#" onclick="app.geraTabLotesEtiq('${dr[30]}', '${dr[3]}', 1, '${dr[1]}')"> 
                      <img src="./assets21/img/printer.png" height=40px width=40px style="margin:0px 5%">
                      </img>
                    </a>
                  </td>`
            }
            htmlBotoes += '<br>' + (dr[32] == undefined ? '' : dr[32]) + `</center>`;
          } else {
            htmlBotoes = `<center> ${htmlBtLote}`

            if (((app.appData.aptoAtivo || 0) == 0) || ((app.appData.aptoAtivo || 0) != 0 && app.appData.recurso != app.appData.recursoAtivo)) {
              htmlBotoes +=
                `<td>
                    <a href="#" onclick="app.startOrder(${dr[0]},${dr[1]},${dr[2]})"> 
                      <img src="./assets21/img/app_t20_wostart.png" height=40px width=40px style="margin:0px 5%">
                      </img>
                    </a>
                  </td>`
            }

            if (dr[30] != null) {
              htmlBotoes +=
                `<td>
                    <a href="#" onclick="app.geraTabLotesEtiq('${dr[30]}', '${dr[3]}', 0,'${dr[1]}')"> 
                      <img src="./assets21/img/printer.png" height=40px width=40px style="margin:0px 5%">
                      </img>
                    </a>
                  </td>`
            }

            htmlBotoes += '<br>' + (dr[32] == undefined ? '' : dr[32]) + `</center>`;
          }
          cell.innerHTML = htmlBotoes;
        },
      ],
    };

    return gridOutros
  }

  returnGridDobradeira(nomeGrid) {
    let gridOutros = {
      name: nomeGrid,
      grid: [
        [
          { title: _t("Início") },
          { title: _t("Previsto (min)") },
          { title: _t("OP") },
          { title: _t("Desenho") },
          { title: _t("Descrição do Item") },
          { title: _t("Quantidade") },
          { title: _t("Peso Total") },
          { title: _t("Produzido") },
          { title: _t("") },
        ],
        function (tbody, rid, dr) {
          let row, cell, i;
          row = tbody.insertRow(-1);
          row.setAttribute("data-rid", rid);
          if (dr[32] != '' && dr[32] != null) {
            row.setAttribute("style", "background-color:#f4998d");
          } else {
            row.setAttribute("style", "background-color:#FFFFFF");
          }
          i = 0;

          //Data Inicio
          cell = row.insertCell(i++);
          cell.innerHTML = dr[37];
          cell.setAttribute("onClick", "app.pararApontamento(" + rid + ")");

          //Tempo Previsto
          cell = row.insertCell(i++);
          cell.innerHTML = parseInt(dr[39]);
          cell.setAttribute("onClick", "app.pararApontamento(" + rid + ")");

          //OP
          cell = row.insertCell(i++);
          cell.innerHTML = dr[3];
          cell.setAttribute("onClick", "app.pararApontamento(" + rid + ")");

          //desenho
          if (dr[35] != '' && dr[35] != null) {
            app.appData.dimensoes.push([dr[3], dr[35]]);
            app.appData.angulos.push([dr[3], dr[36]]);

            cell = row.insertCell(i++);
            cell.innerHTML = `
              <img 
              width="64" 
              height="64" 
              src="${dr[5]}"
              onClick="app.geraDesDobradeira('${dr[3]}', '${dr[5]}')" 
              onError="this.src='assets21/img/app_t20_extGRPO.png'; this.onerror = null"
              >
              
              <br>
            `;
          } else {
            cell = row.insertCell(i++);
            cell.innerHTML = `<img width="64" height="64" src="${dr[5]}"
                            onClick="app.imageDialog('${dr[5]}','${dr[3]}-${dr[6]}')"
                            onError="this.src='assets21//img//wbb.png'"
                            ><br>`;
          }

          //Item
          cell = row.insertCell(i++);
          cell.innerHTML = dr[6];
          cell.setAttribute("onClick", "app.pararApontamento(" + rid + ")");

          //Quantidade
          cell = row.insertCell(i++);
          cell.innerHTML = dr[7];
          cell.setAttribute("onClick", "app.pararApontamento(" + rid + ")");

          //Total
          cell = row.insertCell(i++);
          cell.innerHTML = Math.round(parseFloat(dr[19]));
          cell.setAttribute("onClick", "app.pararApontamento(" + rid + ")");

          //Produzido
          cell = row.insertCell(i++);
          cell.innerHTML = dr[8];
          cell.setAttribute("onClick", "app.pararApontamento(" + rid + ")");

          //Botoes
          let htmlBotoes, htmlBtLote = "";
          cell = row.insertCell(i++);

          if (rid == 0) {
            app.appData.aptoAtivo = dr[11]
            app.appData.recursoAtivo = dr[14]
          }

          if (dr[18] != "" && dr[18] != undefined) {
            htmlBtLote =
              `<td>
                <a href="#" onclick="app.getInfoLotes('${dr[18]}')"> 
                  <img src="./assets21/img/msg-info.png" height=40px width=40px style="margin:0px 5%">
                  </img>
                </a>
              </td>
            <td>`
          }

          if (dr[11] != "" && dr[11] != undefined) {
            htmlBotoes = `
            <center>
              <b>${dr[16]}</b>
              <br>
                ${htmlBtLote}
                <a href="#" onclick="app.stopOrder(${dr[11]}, 'stop')"> 
                  <img src="./assets21/img/msg-error.png" height=40px width=40px style="margin:0px 5%">
                  </img>
                </a>
              </td>
              <td>
                <a href="#" onclick="app.initApto('${dr[18]}', ${dr[20]}, ${dr[11]}, ${dr[25]}, ${dr[27]}, '${dr[3]}', ${dr[23]})">
                  <img src="./assets21/img/msg-ok.png" height=40px width=40px style="margin:0px 5%">
                  </img>
                </a>
              </td>
              <td>
                <a href="#" onclick="app.eventInterruption('${app.appData.recurso}','${dr[17]}' )">
                  <img src="./assets21/img/stillstand.png" height=40px width=40px style="margin:0px 5%">
                  </img>
                </a>
              </td>`
            if (app.appData.recurso != dr[14]) {
              htmlBotoes += `
              <td>
                <a href="#" onclick="app.startOrder(${dr[0]},${dr[1]},${dr[2]})"> 
                  <img src="./assets21/img/app_t20_wostart.png" height=40px width=40px style="margin:0px 5%">
                  </img>
                </a>
              </td>`
            }

            if (dr[31] > 0) {
              htmlBotoes +=
                `<td>
                  <a href="#" onclick="app.geraTabLotesEtiq('${dr[30]}', '${dr[3]}', 2, '${dr[1]}')"> 
                    <img src="./assets21/img/printer.png" height=40px width=40px style="margin:0px 5%">
                    </img>
                  </a>
                </td>`
            }

            htmlBotoes += '<br>' + (dr[32] == undefined ? '' : dr[32]) + `</center>`;
          } else {
            htmlBotoes = `<center> ${htmlBtLote}`

            if (((app.appData.aptoAtivo || 0) == 0) || ((app.appData.aptoAtivo || 0) != 0 && app.appData.recurso != app.appData.recursoAtivo)) {
              htmlBotoes +=
                `<td>
                    <a href="#" onclick="app.startOrder(${dr[0]},${dr[1]},${dr[2]})"> 
                      <img src="./assets21/img/app_t20_wostart.png" height=40px width=40px style="margin:0px 5%">
                      </img>
                    </a>
                  </td>`
            }

            if (dr[31] > 0) {
              htmlBotoes +=
                `<td>
                    <a href="#" onclick="app.geraTabLotesEtiq('${dr[30]}', '${dr[3]}', 0, '${dr[1]}')"> 
                      <img src="./assets21/img/printer.png" height=40px width=40px style="margin:0px 5%">
                      </img>
                    </a>
                  </td>`
            }

            htmlBotoes += '<br>' + (dr[32] == undefined ? '' : dr[32]) + `</center>`;
          }
          cell.innerHTML = htmlBotoes;
        },
      ],
    };

    return gridOutros
  }

  printEtiq(op, lote, maquina, pos) {
    let maq

    switch (maquina) {
      case "DESBOBINADOR":
        maq = 2
        break;

      case "GUILHOTINAS":
        maq = 1
        break;

      case "PREN. DOBRADEIRA":
        maq = 0
        break;

      case "PREN. DOBRADEIRA 3 MT":
        maq = 0
        break;
    }

    let dados = {
      get: 'printEtiq',
      op: parseInt(op),
      lote: lote === "null" ? 0 : lote,
      maquina: maq,
      belpos: parseInt(pos),
      impressora: this.appData.impressora
    }
    //ux.dialog("Apontamento realizado com sucesso!", result.ret_text, { buttons: [{ id: 'ok', title: _t("OK"), type: "is-success" }] });
    //app.appData_clear();
    //app.gui();

    ux.apost('?program_id=' + appInfo.gid + '&page=' + appInfo.appID, dados, function (err, result) {
      if (!ux.aError(result, true)) {
        if (result.ret_code > 0) {

        } else {
          console.log(result)
        }
      } else {
        console.log(result.ret_code)
      }
    }, {
      timeout: 180000
    });
  }

  generateGridButton() {
    this.gridButtons = [];
    let grid

    let emprules = this.employerules;

    emprules.forEach((x) => {
      switch (x[3]) {
        case "OUTROS":
          grid = this.returnGridOutros();
          break;

        case "GUILHOTINAS":
          grid = this.returnGridGuilhotina();
          break;

        case "PREN. DOBRADEIRA":
          grid = this.returnGridDobradeira(x[3]);
          break;

        case "PREN. DOBRADEIRA 3 MT":
          grid = this.returnGridDobradeira(x[3]);
          break;

        case "DESBOBINADOR":
          grid = this.returnGridDesbobinador();
          break;

        default:
          grid = this.returnGridOutros();
          break;
      }

      this.gridButtons.push(grid);
    });
  }

  generateViewButton() {
    let emprules = this.employerules;

    emprules.forEach((x) => {
      let button = [];

      button[0] = x[0];
      button[1] = x[1];
      button[2] = x[2];
      button[3] = x[3];
      button[4] = x[4];

      let view = this.gridButtons.filter((a) => a.name === x[3]);
      let grid = view[0].grid;
      let viewButton = button.concat(grid);

      this.viewButtons.push(viewButton);
    });
  }

  gui() {
    // ###### UI #######
    let poolColumns = [];
    this.viewButtons.forEach((x) => {
      poolColumns.push({
        content: ui.button(x[0], x[1], {
          licon: "",
          type: "is-link is-fullwidth",
        }),
      });
    });
    let poolOptions = ui.columns(poolColumns, { isMobile: true });
    let tabOrdens =
      //ui.input(_t("Grapas Filtro"), "dgGrapas_Filter", "", { licon: "fa-search", rbutton: "fa-search", autofocus: true })
      ui.columns(
        [
          {
            content: ui.input("Cliente", "filtroCliente", "", {
              licon: "fa-search",
              rbutton: "fa-search",
              autofocus: true,
              type: "text",
            }),
            size: "1/4",
          },
          {
            content: ui.input("Lote", "filtroLote", "", {
              licon: "fa-search",
              rbutton: "fa-search",
              autofocus: true,
              type: "text",
            }),
            size: "1/4",
          },

          {
            content: ui.button("bStart", "Iniciar", {
              licon: "play",
              type: "is-flex",
            }),
            size: "1/4",
          },
          {
            content: ui.button("bStop", "Parar", {
              licon: "stop",
              type: "is-flex",
            }),
            size: "1/4",
          },
          //{content: ui.button('bRegistrar',"Concu",{licon:"check", type:"is-flex"}),size:"1/5"},
        ],
        { isMobile: true }
      ) + ui.dgrid("dgOrdens");

    var tabListaOrdens =
      ui.columns(
        [
          {
            content: ui.input(_t("Filtro"), "filter", "", {
              licon: "fa-cube",
              rbutton: "fa-search",
            }),
            size: "2/4",
          },
          {
            content: ui.input(_t("Espessura"), "filterEspessura", "", {
              licon: "fa-cube",
              rbutton: "fa-search",
            }),
            size: "2/4",
          }
          //{content: ui.button('bRegistrar',"Concu",{licon:"check", type:"is-flex"}),size:"1/5"},
        ],
        { isMobile: true }
      )
      + ui.dgrid("dgOrdens");

    var tabApontamento = ui.box(
      '<div id="botoesReg"></div>'

      // Linha 1: Lotes (1/2) | Saldo (3/8) | Imprimir (1/8) — botão alinhado à direita
      + ui.columns([
        { size: "1/2", content: ui.select("Lotes:", "cbLoteReg", "", this.appData.lotesReservados, { licon: "fa-comment", autofocus: true, type: 'text' }) },
        { size: "3/8", content: ui.input("Saldo:", "saldoReg", "", { licon: "fa-calculator", autofocus: true, type: 'number', readonly: true }) },
        {
          size: "1/8",
          content: `<button id="btnImprimirApto" style="
              width:100%; color:white; height:3.4em; font-size:14px; font-weight:bold;
              border:none; border-radius:4px; cursor:pointer; background-color:#274f9b;
              display:flex; align-items:center; justify-content:center; gap:6px;
              margin-top:1.6em;"
            onclick="app.printEtiqFromApto()" title="Imprimir Etiqueta">
            <img src="./assets21/img/printer.png" height="22px" width="22px" style="filter:brightness(10)">
            Imprimir
          </button>`
        }
      ])

      // Linha 2: 4 inputs proporcionais (7/8) + Salvar Registro (1/8) — alinhado à direita
      + ui.columns([
        { size: "1/4", content: ui.input("Chapas:", "qtdPcReg", "", { licon: "fa-calculator", autofocus: true, type: 'number' }) },
        { size: "1/4", content: ui.input("Blank/Barras:", "qtdBlank", "", { licon: "fa-calculator", autofocus: true, type: 'number' }) },
        { size: "1/4", content: ui.input("Peso:", "pesoReg", "", { licon: "fa-calculator", autofocus: true, type: 'number' }) },
        { size: "1/8", content: ui.input("Sucata:", "qtdRef", "", { licon: "fa-calculator", autofocus: true, type: 'number' }) },
        {
          size: "1/8",
          content: `<button id="btnSalvarRegistro" style="
              width:100%; color:white; height:3.4em; font-size:14px; font-weight:bold;
              border:none; border-radius:4px; cursor:pointer; background-color:#1927AA;
              margin-top:1.6em;"
            onclick="app.salvaRegistro()">Salvar Registro</button>`
        }
      ])
      + '<div id="msgAlertaPeso" style="color:red; font-weight:bold; font-size:14px; text-align:center; display:none; padding-bottom:10px;"></div>'
      + '<div id="msgPerda" style="color:#d32f2f; font-weight:bold; font-size:13px; text-align:left; display:none; padding:2px 0 8px 8px;"></div>'

      // Linha 3: Item Aprov (4/8) | Quantidade (3/8) | Finalizar centralizado (vertically) | Cálculo (1/8)
      + ui.columns([
        {
          size: "4/8",
          content: ui.input(_t("Item Aprov."), "txtItemAprov", "", { licon: "fa-cube", rbutton: "fa-search" }),
        },
        {
          size: "2/8",
          content: ui.input(_t("Quantidade"), "txtQuantAprov", "", { licon: "fa-cube" }),
        },
        {
          size: "1/8",
          content: `<div style="display:flex; align-items:center; justify-content:center; height:100%; padding-top:1.6em;">
            ${ui.checkbox("Finalizar Apontamento", "chkFinaliza", false)}
          </div>`
        },
        {
          size: "1/8",
          content: `<button style="
              width:100%; color:white; height:3.4em; font-size:14px; font-weight:bold;
              border-radius:4px; background-color:#274f9b; border:none; cursor:pointer;
              display:flex; align-items:center; justify-content:center; gap:6px;
              margin-top:1.6em;"
            onclick="app.showMemorialCalculo()" title="Memorial de Cálculo">
            <span style="font-family:serif; font-style:italic; font-weight:bold; font-size:1.2em;">i</span>
            Cálculo
          </button>`
        }
      ],
        { isMobile: true })

      + '<br>'
      + '<div id="tabLotesEtq"></div>'
      // Painel de histórico — últimos N apontamentos desta OP. Preenchido por
      // app.renderHistoricoApto() após carregar via GetHistoricoApontamentos.
      + '<div id="painelHistorico" style="display:none; margin-top:14px; border:1px solid #e0e0e0; border-radius:4px; padding:10px 14px; background:#fafafa;"></div>'
      //+ '<Center>' + ui.title("Quantidade Apontada", { type: "title", size: 4 }) + '</center>'
      //+ '<br>'
      //+ ui.dgrid("dgRegistros") 

    );

    var html = ui.box(
      poolOptions +
      ui.tabs("MApp", [
        {
          title: "Lista de Ordens",
          icon: ui.fa("fire"),
          active: true,
          content: tabListaOrdens,
          id: "tabListaOrdens",
        },
        {
          title: "Apontamento",
          icon: ui.fa("water"),
          content: tabApontamento,
          id: "tabApontamento",
        },
      ])
    );

    document.getElementById("app-container").innerHTML = html;

    this.uxInit();
  }

  uxInit() {
    // ###### UX #######

    ux.tabs("MApp", "init");

    this.viewButtons.forEach((x) => {
      ux.listen(
        "click",
        x[0],
        function (e) {
          this.setAtual(x);
        }.bind(this)
      );
    });

    //this.carregaDgOrdens('')

    ux.listen("change", "qtdPcReg", function () {
      //ux.getElement("pesoReg").value = parseFloat(parseInt(ux.getElement("qtdPcReg").value) * parseFloat(app.appData.pesochapa.replace(".",",")).toFixed(2)).toFixed(2)

      if (app.appData.grupo == "GUILHOTINAS") {
        // Sem perda: qtdBlank = qtdPcReg * blanksPorChapa (preenchimento ótimo da chapa)
        let qtdPcRegInformado = parseInt(ux.getElement("qtdPcReg").value) || 0
        let blanksPorChapa = parseInt(app.appData.quantBlank) || 0
        let totalBlankCalc = qtdPcRegInformado * blanksPorChapa

        ux.getElement("qtdBlank").value = totalBlankCalc

        // Trava o teto do campo qtdBlank ao máximo possível para essa qtd de chapas.
        // Isso impede que os botões spinner do <input type="number"> e a digitação
        // ultrapassem o limite — não se pode produzir mais blanks do que cabe nas chapas.
        let elBlank = ux.getElement("qtdBlank")
        if (elBlank) {
          elBlank.setAttribute("max", totalBlankCalc)
          elBlank.setAttribute("min", "0")
        }

        // Mudou a quantidade de chapas → não há perda (blanks foram redefinidos ao teórico)
        app.atualizaMsgPerda(0)

        // pesochapa = peso ORIGINAL da chapa (com refilo). NÃO mutar — ver nota abaixo.
        let pesoPorLarg = parseFloat(app.appData.pesochapa) / parseFloat(app.appData.larguraLote.replace(".", ""))
        let largPA = blanksPorChapa * app.appData.desenvBlank
        let pesoUnitBlank = app.appData.desenvBlank * pesoPorLarg

        // Peso útil = peso de todos os blanks bons (cenário sem perda → todos os teóricos)
        let pesoPA = qtdPcRegInformado * (largPA * pesoPorLarg)

        // Refilo = parcela do refilo da chapa atribuída a esta OP (proporcional ao consumo).
        // Em cenário mono-OP (desenvTotal = blanksPorChapa*desenvBlank) → refilo total da chapa.
        // Em cenário multi-OP → divide proporcionalmente, conforme planilha Excel.
        let pesoSucata = (app.appData.desenvBlank / app.appData.desenvTotal) * parseFloat(app.appData.pesochapa) * totalBlankCalc - pesoPA

        app.appData.pesoUnitBlank = pesoUnitBlank
        // ATENÇÃO: NÃO sobrescrever app.appData.pesochapa aqui.
        // A linha antiga `app.appData.pesochapa = desenvTotal * pesoPorLarg` causava bug:
        // a cada digitação em qtdPcReg/qtdBlank o pesochapa encolhia (virava "peso útil"),
        // e o evento seguinte recalculava em cima desse valor menor — perdendo o refilo na sucata.
        // O pesochapa deve permanecer fixo (vem do lote, linha 1027) durante toda a edição.

        if (app.appData.grupo != 'DESBOBINADOR') {
          ux.getElement("pesoReg").value = Math.round(pesoPA)
        }
        ux.getElement("qtdRef").value = Math.round(pesoSucata)
      }

      if (app.appData.grupo == "PREN. DOBRADEIRA" || app.appData.grupo == "PREN. DOBRADEIRA 3 MT") {
        // Dobradeira não trabalha com chapas — o operador conta peças (blanks).
        // Se chapas mudou, apenas re-dispara o cálculo de qtdBlank para manter os campos coerentes.
        let elBlank = ux.getElement("qtdBlank")
        if (elBlank) elBlank.dispatchEvent(new Event('change'))
      }
      app.validaPeso();
    })

    ux.listen("change", "qtdBlank", function () {
      if (app.appData.grupo == "GUILHOTINAS") {
        // pesochapa = peso ORIGINAL da chapa (com refilo). NÃO mutar.
        let pesoPorLarg = parseFloat(app.appData.pesochapa) / parseFloat(app.appData.larguraLote.replace(".", ""))
        let blanksPorChapa = parseInt(app.appData.quantBlank) || 0
        let largPA = blanksPorChapa * app.appData.desenvBlank
        let pesoUnitBlank = app.appData.desenvBlank * pesoPorLarg

        // Quantidade de chapas é DEFINIDA pelo campo Chapas. Mudar Blank/Barras NÃO altera
        // a quantidade de chapas — qualquer diferença para menos é tratada como PERDA.
        let chapasFixas = parseInt(ux.getElement("qtdPcReg").value) || 0
        let totalBlankMaximo = chapasFixas * blanksPorChapa
        let qtdBlankInformado = parseInt(ux.getElement("qtdBlank").value) || 0

        // TRAVA: não permitir produzir mais blanks do que cabe nas chapas apontadas.
        // Se o operador digitar/clicar acima do máximo, o valor é fixado no teto.
        if (qtdBlankInformado > totalBlankMaximo) {
          qtdBlankInformado = totalBlankMaximo
          ux.getElement("qtdBlank").value = totalBlankMaximo
        }
        // (Garante também que não fica negativo)
        if (qtdBlankInformado < 0) {
          qtdBlankInformado = 0
          ux.getElement("qtdBlank").value = 0
        }

        // Garante que o atributo max do campo está atualizado (caso o lote tenha sido
        // selecionado antes do listener de qtdPcReg disparar).
        let elBlank = ux.getElement("qtdBlank")
        if (elBlank) {
          elBlank.setAttribute("max", totalBlankMaximo)
          elBlank.setAttribute("min", "0")
        }

        // Diferença entre o teórico e o informado = PERDA (em quantidade de blanks)
        let blanksPerdidos = totalBlankMaximo - qtdBlankInformado

        // Atualiza o aviso visual de perda na tela
        app.atualizaMsgPerda(blanksPerdidos)

        // Peso útil teórico (todos os blanks bons que CABERIAM nas chapas consumidas)
        let pesoPA = chapasFixas * (largPA * pesoPorLarg)

        // Refilo proporcional ao consumo da chapa (idêntico ao caso sem perda — refilo
        // depende do nº de chapas consumidas, não do nº de blanks bons produzidos).
        let pesoRefilo = (app.appData.desenvBlank / app.appData.desenvTotal) * parseFloat(app.appData.pesochapa) * totalBlankMaximo - pesoPA

        app.appData.pesoUnitBlank = pesoUnitBlank
        // ATENÇÃO: NÃO sobrescrever app.appData.pesochapa (ver nota no handler de qtdPcReg).

        // Peso (campo "Peso:") = SOMENTE blanks efetivamente produzidos
        ux.getElement("pesoReg").value = Math.round(pesoUnitBlank * qtdBlankInformado)

        // Sucata (campo "Sucata:") = refilo da chapa + peso dos blanks perdidos
        // Conservação: pesoReg + qtdRef == chapas × pesochapa (peso bruto consumido do lote)
        ux.getElement("qtdRef").value = Math.round(pesoRefilo + (blanksPerdidos * pesoUnitBlank))
      }

      if (app.appData.grupo == "PREN. DOBRADEIRA" || app.appData.grupo == "PREN. DOBRADEIRA 3 MT") {
        // ============================================================================
        // DOBRADEIRA — Cálculo geométrico do peso unitário do blank.
        //
        // Fórmula:  pesoUnitBlank = desenvBlank × (pesochapa / largBobina)
        //
        // Onde:
        //   - pesochapa  = peso BRUTO da chapa pai (com refilo), do U_SPS_PesoChapa do lote
        //   - largBobina = largura TOTAL da chapa pai (com refilo), em mm
        //   - desenvBlank = desenvolvimento deste blank, em mm
        //
        // Por que dividir pela largura TOTAL (com refilo) e NÃO pela largura útil:
        //   pesochapa é o peso bruto pesado na balança (inclui o refilo).
        //   largBobina é a largura física da bobina (inclui o refilo).
        //   Dividindo grandezas coerentes (ambas COM refilo), a divisão se cancela
        //   e cada blank recebe sua fatia proporcional ao desenvolvimento que ocupa.
        //
        // Por que NÃO usar saldoLote / qtdEsperada (fórmula antiga):
        //   Quando o mesmo lote alimenta múltiplas OPs (mesma chapa cortada em blanks
        //   de itens diferentes), saldoLote é o peso total do lote dividido pela
        //   quantidade de UMA OP — atribuía o peso do lote inteiro a uma OP só.
        //
        // Conservação de massa (validado): a soma dos pesos unitários × quantidades
        // de TODAS as OPs do plano de corte = peso total das chapas consumidas.
        // ============================================================================
        let pesochapa   = parseFloat(app.appData.pesochapa) || 0
        let desenvBlank = parseFloat(app.appData.desenvBlank) || 0
        let largBobina  = parseFloat(app.appData.largBobina) || 0

        let pesoUnitBlank = 0
        if (largBobina >= 50 && pesochapa > 0 && desenvBlank > 0) {
          pesoUnitBlank = desenvBlank * (pesochapa / largBobina)
        } else {
          console.warn(`[DOBRADEIRA] Dados insuficientes para cálculo geométrico — pesochapa=${pesochapa}, desenvBlank=${desenvBlank}, largBobina=${largBobina}`)
        }
        app.appData.pesoUnitBlank = pesoUnitBlank

        // Quantidade que ainda falta produzir nesta OP (em peças)
        let opAtual = (app.appData.opAtual && app.appData.opAtual[0]) || []
        let mengeOP = parseFloat(opAtual[7]) || 0       // dr[7] = T1.MENGE (qty da OP)
        let produzidoOP = parseFloat(opAtual[8]) || 0   // dr[8] = ProduzidoUN (já produzido)
        let qtdEsperada = mengeOP - produzidoOP
        if (qtdEsperada <= 0) qtdEsperada = mengeOP // fallback (sem produção anterior registrada)

        // Lê e valida a quantidade informada
        let qtdBlankInformado = parseInt(ux.getElement("qtdBlank").value) || 0

        // TRAVA: não permite informar mais blanks do que o esperado (teto = qtdEsperada)
        if (qtdBlankInformado > qtdEsperada) {
          qtdBlankInformado = qtdEsperada
          ux.getElement("qtdBlank").value = qtdEsperada
        }
        if (qtdBlankInformado < 0) {
          qtdBlankInformado = 0
          ux.getElement("qtdBlank").value = 0
        }

        // Atualiza atributo max do input (trava também os botões spinner)
        let elBlank = ux.getElement("qtdBlank")
        if (elBlank) {
          elBlank.setAttribute("max", qtdEsperada)
          elBlank.setAttribute("min", "0")
        }

        // Peso = peças produzidas × peso unitário (cálculo geométrico)
        ux.getElement("pesoReg").value = Math.round(qtdBlankInformado * pesoUnitBlank)

        // Perdas pendentes (= esperado - informado).
        let blanksPerdidos = qtdEsperada - qtdBlankInformado

        // Sucata na dobradeira é em PEÇAS (não kg) — o stopOrder converte via × pesoUnitBlank.
        // Se "Finalizar Apontamento" marcado E há perda → perdas viram sucata e consomem o saldo.
        // Se não marcado → 0 (perdas ficam pendentes para o próximo apontamento).
        let chkFinaliza = document.getElementById("chkFinaliza")
        let isFinalizar = chkFinaliza && chkFinaliza.checked
        ux.getElement("qtdRef").value = (isFinalizar && blanksPerdidos > 0) ? blanksPerdidos : 0

        // Aviso visual: na dobradeira só faz sentido mostrar "perdas → sucata" quando o
        // operador marcou Finalizar (caso contrário as peças faltantes apenas ficam para
        // a próxima sessão, NÃO viram sucata).
        app.atualizaMsgPerda(isFinalizar ? blanksPerdidos : 0)
      }
      app.validaPeso();
    })

    ux.listen(
      "changing",
      "MApp",
      function (e) {
        if (e.detail.targetTab == "tabApontamento") {
          if (app.appData.bloqTabApto == false) {
            e.preventDefault()
          } else {
            app.appData.bloqTabApto = false
          }
        }

        if (e.detail.targetTab == "tabListaOrdens") {
          app.appData.bloqTabApto == false
        }
      }.bind(this)
    );

    ux.listen("change", "cbLoteReg", async function (e) {
      ux.getElement("qtdPcReg").value = ""
      ux.getElement("pesoReg").value = ""
      ux.getElement("qtdBlank").value = ""
      ux.getElement("qtdRef").value = ""
      ux.getElement("txtItemAprov").value = ""
      ux.getElement("txtQuantAprov").value = ""
      ux.set('txtItemAprov', 'subtitle', '')
      ux.set('txtQuantAprov', 'subtitle', '')
      // Reseta avisos visuais e travas do campo Blank/Barras quando o lote muda
      app.atualizaMsgPerda(0)
      let elBlankReset = ux.getElement("qtdBlank")
      if (elBlankReset) {
        elBlankReset.removeAttribute("max")
        elBlankReset.removeAttribute("min")
      }
      let lote = ux.getElement("cbLoteReg").value
      var listaLote = app.appData.lotesReservados.filter((x) => x[0] === lote)
      ux.getElement("saldoReg").value = listaLote[0][1]
      var lt = app.appData.lotes.filter(item => item.includes(ux.getElement("cbLoteReg").value))
      app.appData.larguraLote = lt[0].toString().split('*')[6]
      app.appData.pesochapa = lt[0].toString().split('*')[7]
      app.appData.absentry = lt[0].toString().split('*')[8]
      await app.getContLote(lt[0].toString().split('*')[0], app.appData.opAtual[0][6].split('-')[0])

    }.bind(this))

    // Quando o operador marca/desmarca "Finalizar Apontamento", a regra de sucata muda
    // (na dobradeira, perdas só viram sucata se finalizar). Re-dispara o cálculo de
    // qtdBlank para refletir o novo estado imediatamente.
    ux.listen("click", "chkFinaliza", function () {
      let elBlank = ux.getElement("qtdBlank")
      if (elBlank && elBlank.value !== "") {
        elBlank.dispatchEvent(new Event('change'))
      }
    })

    ux.listen(
      "click",
      "appSave",
      function (e) {
        this.checkAll();
      }.bind(this)
    );
    ux.listen(
      "click",
      "filter-rbutton",
      function (e) {
        this.listarOrdens();
      }.bind(this)
    );
    ux.listen(
      "click",
      "filterEspessura-rbutton",
      function (e) {
        this.listarOrdens();
      }.bind(this)
    );
    ux.listen(
      "keyup",
      "filter",
      function (e) {
        if (e.keyCode === 13) this.listarOrdens();
      }.bind(this)
    );

    ux.listen(
      "keyup",
      "filterEspessura",
      function (e) {
        if (e.keyCode === 13) this.listarOrdens();
      }.bind(this)
    );
    ux.listen("change", "pesoReg", function () {
      app.validaPeso();
    });
    let _setItem = function (d) {
      ux.getElement("txtItemAprov").value = d.selected_row[0]
      ux.set('txtItemAprov', 'subtitle', d.selected_row[1])
      ux.set('txtQuantAprov', 'subtitle', d.selected_row[2])
    }

    ux.click("txtItemAprov-rbutton", async function () {
      await sps.gridExtend('beas_webapp_modoutros', 'GetItensAproveitamento', [], ["Cód. Item", "Descrição", "UM"], _setItem);
    }.bind(this)
    )
  }

  async getContLote(lote, item) {
    await this.executaProcAux('GetContLote', 0, 0, 0, [lote, item], "contLote");
  }

  calculaDesenvTotal(op, nr) {
    let rows = ux.dgrid("dgOrdens").rows.value;
    let desenvTotal = 0
    var ops = rows.filter((x) => x[0] == op.split("/")[0] && x[23] == nr)

    for (let i = 0; i < ops.length; i++) {
      const e = ops[i];
      desenvTotal += (parseInt(e[25]) * parseFloat(e[27]))
    }

    return desenvTotal
  }

  showMemorialCalculo() {
    let html = '';
    const grupo = app.appData.grupo;
    const pesochapa = parseFloat(app.appData.pesochapa) || 0;
    const desenvBlank = app.appData.desenvBlank || 0;
    const desenvTotal = app.appData.desenvTotal || 0;
    const quantBlank = parseInt(app.appData.quantBlank) || 0;
    const larguraLote = parseFloat((app.appData.larguraLote || '0').toString().replace('.', '')) || 0;
    const qtdPcReg = parseInt(ux.getElement("qtdPcReg").value) || 0;
    const qtdBlankField = parseInt(ux.getElement("qtdBlank").value) || 0;
    const pesoReg = parseFloat(ux.getElement("pesoReg").value) || 0;
    const qtdRef = parseFloat(ux.getElement("qtdRef").value) || 0;

    const estilo = `
      <style>
        .mc-table { width:100%; border-collapse:collapse; margin:8px 0; font-size:16px; }
        .mc-table th { background:#1927AA; color:#fff; padding:8px 12px; text-align:left; }
        .mc-table td { padding:6px 12px; border-bottom:1px solid #ddd; }
        .mc-table tr:nth-child(even) { background:#f2f2f2; }
        .mc-section { font-size:18px; font-weight:bold; color:#1927AA; margin:14px 0 6px 0; }
        .mc-formula { background:#fffde7; padding:10px; border-left:4px solid #f9a825; margin:8px 0; font-family:monospace; font-size:15px; }
        .mc-result { background:#e8f5e9; padding:10px; border-left:4px solid #43a047; margin:8px 0; font-size:17px; font-weight:bold; }
      </style>`;

    if (grupo == "GUILHOTINAS") {
      let pesoPorLarg = pesochapa / larguraLote;
      let largPA = quantBlank * desenvBlank;
      let pesoUnitBlank = desenvBlank * pesoPorLarg;

      // Recálculo de chapas arredondando para cima
      let chapasRecalculadas = Math.ceil(qtdBlankField / quantBlank);
      let totalBlankCalc = chapasRecalculadas * quantBlank;
      let blanksSobra = totalBlankCalc - qtdBlankField;
      let houvDesvio = (chapasRecalculadas !== qtdPcReg || blanksSobra > 0);

      let pesoPA_chapas = chapasRecalculadas * (largPA * pesoPorLarg);
      let pesoRefilo = (desenvBlank / desenvTotal) * pesochapa * totalBlankCalc - pesoPA_chapas;
      let pesoBlanksSobra = blanksSobra * pesoUnitBlank;
      let sucataTotal = pesoRefilo + pesoBlanksSobra;

      let pesoPAinformado = Math.round(pesoUnitBlank * qtdBlankField);

      html = estilo + `
        <div class="mc-section">1. Variáveis de Entrada</div>
        <table class="mc-table">
          <tr><th>Variável</th><th>Valor</th></tr>
          <tr><td>Peso da Chapa (lote)</td><td>${pesochapa.toFixed(2)} kg</td></tr>
          <tr><td>Largura do Lote</td><td>${larguraLote} mm</td></tr>
          <tr><td>Desenvolvimento do Blank</td><td>${desenvBlank} mm</td></tr>
          <tr><td>Desenvolvimento Total (plano)</td><td>${desenvTotal} mm</td></tr>
          <tr><td>Qtd. Blanks por Chapa</td><td>${quantBlank}</td></tr>
          <tr><td>Qtd. Blanks informada</td><td>${qtdBlankField}</td></tr>
        </table>

        <div class="mc-section">2. Arredondamento de Chapas</div>
        <div class="mc-formula">
          chapasNecessárias = ⌈ qtdBlanksInformada / blanksPorChapa ⌉<br>
          chapasNecessárias = ⌈ ${qtdBlankField} / ${quantBlank} ⌉ = <b>${chapasRecalculadas}</b>
        </div>
        <div class="mc-formula">
          totalBlanksPossíveis = chapas × blanksPorChapa<br>
          totalBlanksPossíveis = ${chapasRecalculadas} × ${quantBlank} = <b>${totalBlankCalc}</b>
        </div>
        ${blanksSobra > 0 ? `<div class="mc-formula" style="border-left-color:#e65100; background:#fff3e0;">
          blanksSobra = totalBlanksPossíveis − blanksInformados<br>
          blanksSobra = ${totalBlankCalc} − ${qtdBlankField} = <b>${blanksSobra}</b> blank(s) → viram sucata
        </div>` : ''}

        <div class="mc-section">3. Cálculo do Peso PA</div>
        <div class="mc-formula">
          pesoPorLarg = pesochapa / larguraLote<br>
          pesoPorLarg = ${pesochapa.toFixed(2)} / ${larguraLote} = <b>${pesoPorLarg.toFixed(6)}</b> kg/mm
        </div>
        <div class="mc-formula">
          pesoUnitBlank = desenvBlank × pesoPorLarg<br>
          pesoUnitBlank = ${desenvBlank} × ${pesoPorLarg.toFixed(6)} = <b>${pesoUnitBlank.toFixed(4)}</b> kg
        </div>
        <div class="mc-formula">
          pesoPA = pesoUnitBlank × blanksInformados<br>
          pesoPA = ${pesoUnitBlank.toFixed(4)} × ${qtdBlankField} = <b>${(pesoUnitBlank * qtdBlankField).toFixed(2)}</b> kg
        </div>
        <div class="mc-result">Peso PA (arredondado) = ${pesoPAinformado} kg</div>

        <div class="mc-section">4. Cálculo da Sucata</div>
        <div class="mc-formula">
          <b>a) Refilo das chapas:</b><br>
          pesoRefilo = (desenvBlank / desenvTotal) × pesochapa × totalBlanksPossíveis − pesoTotalChapas<br>
          pesoRefilo = (${desenvBlank} / ${desenvTotal}) × ${pesochapa.toFixed(2)} × ${totalBlankCalc} − ${pesoPA_chapas.toFixed(2)}<br>
          pesoRefilo = <b>${pesoRefilo.toFixed(2)}</b> kg
        </div>
        ${blanksSobra > 0 ? `<div class="mc-formula" style="border-left-color:#e65100; background:#fff3e0;">
          <b>b) Blanks excedentes (sobra do arredondamento):</b><br>
          pesoBlanksSobra = blanksSobra × pesoUnitBlank<br>
          pesoBlanksSobra = ${blanksSobra} × ${pesoUnitBlank.toFixed(4)} = <b>${pesoBlanksSobra.toFixed(2)}</b> kg
        </div>
        <div class="mc-formula">
          <b>Sucata Total = refilo + blanks sobra</b><br>
          sucataTotal = ${pesoRefilo.toFixed(2)} + ${pesoBlanksSobra.toFixed(2)} = <b>${sucataTotal.toFixed(2)}</b> kg
        </div>` : `<div class="mc-formula">
          <b>b) Sem blanks excedentes (divisão exata)</b>
        </div>`}
        <div class="mc-result">Sucata (arredondado) = ${Math.round(sucataTotal)} kg</div>`;

    } else if (grupo == "PREN. DOBRADEIRA" || grupo == "PREN. DOBRADEIRA 3 MT") {
      const largBobina = parseFloat(app.appData.largBobina) || 0;
      let pesoPorLarg = largBobina > 0 ? pesochapa / largBobina : 0;
      let pesoUnitBlank = desenvBlank * pesoPorLarg;
      let pesoTotal = qtdBlankField * pesoUnitBlank;

      html = estilo + `
        <div class="mc-section">1. Variáveis de Entrada</div>
        <table class="mc-table">
          <tr><th>Variável</th><th>Valor</th></tr>
          <tr><td>Peso da Chapa (lote, bruto com refilo)</td><td>${pesochapa.toFixed(2)} kg</td></tr>
          <tr><td>Largura Total da Bobina (com refilo)</td><td>${largBobina} mm</td></tr>
          <tr><td>Desenvolvimento do Blank</td><td>${desenvBlank} mm</td></tr>
          <tr><td>Largura Útil (soma desenv. blanks, sem refilo)</td><td>${desenvTotal} mm</td></tr>
          <tr><td>Qtd. Blanks informada</td><td>${qtdBlankField}</td></tr>
        </table>

        <div class="mc-section">2. Cálculo do Peso (pela largura total da bobina)</div>
        <div class="mc-formula">
          Peso por mm da bobina (com refilo):<br>
          ${pesochapa.toFixed(2)} / ${largBobina} = <b>${pesoPorLarg.toFixed(6)}</b> kg/mm<br>
          <small><i>Nota: divide-se pela largura TOTAL pois pesoChapa também inclui o refilo. O refilo já foi consumido como sucata na guilhotina, e cada blank carrega proporcionalmente sua fatia do peso bruto.</i></small>
        </div>
        <div class="mc-formula">
          Peso por blank:<br>
          ${desenvBlank} × ${pesoPorLarg.toFixed(6)} = <b>${pesoUnitBlank.toFixed(4)}</b> kg
        </div>
        <div class="mc-formula">
          Peso total:<br>
          ${qtdBlankField} × ${pesoUnitBlank.toFixed(4)} = <b>${pesoTotal.toFixed(2)}</b> kg
        </div>
        <div class="mc-result">Peso = ${parseInt(pesoTotal)} kg</div>`;

    } else if (grupo == "DESBOBINADOR") {
      let qtdChapas = qtdPcReg;
      let pesoDigitado = pesoReg;

      html = estilo + `
        <div class="mc-section">1. Variáveis de Entrada</div>
        <table class="mc-table">
          <tr><th>Variável</th><th>Valor</th></tr>
          <tr><td>Peso da Peça</td><td>${(app.appData.pesopc || 0)} kg</td></tr>
          <tr><td>Qtd. Chapas informada</td><td>${qtdChapas}</td></tr>
        </table>

        <div class="mc-section">2. Peso Informado</div>
        <div class="mc-formula">
          O operador informa o peso manualmente nesta tela.
        </div>
        <div class="mc-result">Peso informado = ${pesoDigitado} kg</div>

        <div class="mc-section">3. Sucata</div>
        <div class="mc-formula">
          Sucata informada = ${qtdRef} kg
        </div>`;

    } else {
      html = '<p>Memorial de cálculo não disponível para este grupo.</p>';
    }

    ux.dialog(_t("Memorial de Cálculo — " + grupo), html, {
      buttons: [{ id: "ok", title: _t("Fechar"), type: "is-info" }]
    });
  }

  setAtual(viewButton) {
    this.appData.atual = viewButton[0];
    this.appData.recurso = viewButton[2];
    this.appData.grupo = viewButton[3];
    this.appData.impressora = viewButton[4];
    this.appData.fields = viewButton[5];
    this.appData.ondraw_row = viewButton[6];
    this.appData.fieldsCon = viewButton[7];
    this.appData.ondraw_rowCon = viewButton[8];
    this.appData.fieldsInd = viewButton[9];
    this.appData.ondraw_rowInd = viewButton[10];

    this.loadInterruptionReasons().then((res) => {
      this.setButtons();
      this.listarOrdens();
    })
  }

  async loadInterruptionReasons() {
    await this.executaProcAux('GetInterrupReasons', 0, 0, 0, [app.appData.recurso, appInfo.ui], "interrupReasons");
  }

  setButtons() {
    this.viewButtons.forEach((x) => {
      if (x[0] === this.appData.atual) {
        ux.getElement(x[0]).style.backgroundColor = "#ff0000";
        ux.getElement(x[0]).style.color = "#000000";
      } else {
        ux.getElement(x[0]).style.backgroundColor = "#3273dc";
        ux.getElement(x[0]).style.color = "#ffffff";
      }
    });
  }

  async listarOrdens(trocar = true) {
    // Initialize the datagrid
    if (trocar) {
      ux.tabs("MApp", "active", "tabListaOrdens");
    }
    ux.dgrid("dgOrdens", {
      limit: 30,
      fields: this.appData.fields,
      url:
        "?program_id=" +
        appInfo.gid +
        "&page=" +
        appInfo.appID +
        "&get=getOrdens&recurso=" +
        this.appData.recurso +
        "&filtro=" +
        document.getElementsByName("filter")[0].value +
        "&espessura=" +
        document.getElementsByName("filterEspessura")[0].value,
      onclick_row: function (d, rid) {
        app.pararApontamento(rid);
      },
      ondraw_row: this.appData.ondraw_row,
    });

    await ux.wait();
    return await Promise.resolve(true);
  }

  startOrder(numop, pos, operacao) {
    let rows = ux.dgrid("dgOrdens").rows.value;
    var ops
    let txtOps = '', msgOpAberta = ''

    if (app.appData.grupo == "GUILHOTINAS") {
      ops = rows.filter((x) => x[0] == numop)
    } else {
      ops = rows.filter((x) => x[0] == numop && x[1] == pos && x[2] == operacao)
    }

    for (let i = 0; i < ops.length; i++) {
      const e = ops[i];
      txtOps += e[0] + '/' + e[1]

      if (i < ops.length - 1) {
        txtOps += ', '
      }
    }

    if (ops[0][38] == 0) {
      msgOpAberta = ''
    } else {
      msgOpAberta =
        `<div style="background-color: red; color: white; font-size: 25px; font-weight: bold; padding: 20px; text-align: center; border-radius: 5px;">
        ##### ATENÇÃO ##### <br><br>
        A OP selecionada já está aberta em outra Máquina.
      </div>`
    }

    ux.dialog(
      _t("Iniciar Ordem de Produção"),
      msgOpAberta +
      ui.title("Deseja realmente iniciar as Ordens?", {
        type: "title",
        size: 5,
      }) +
      "<small><strong>Nº da OP/Posição: </strong></small>" +
      txtOps,
      {
        buttons: [
          {
            id: "sim",
            title: _t("Sim"),
            type: "is-success",
          },
          {
            id: "nao",
            title: _t("Não"),
            type: "is-danger",
          },
        ],
      },
      function (b) {
        if (b == "nao") {
        }

        if (b == "sim") {
          for (let i = 0; i < ops.length; i++) {
            const e = ops[i];

            let bsl = {
              PersonnelId: appInfo.uid,
              DocEntry: e[0],
              LineNumber: e[1],
              LineNumber2: e[2],
              ResourceId: this.appData.recurso,
            };

            ux.saveAll(
              "/odata4/v1/TimeReceiptRunning?$ProgramId=" +
              appInfo.gid +
              "&$AppId=" +
              appInfo.appID,
              bsl,
              function (err, result) {
                if (!ux.aError(result, false)) {
                  ux.dialog(
                    _t("Inicio de Ordem"),
                    _t("Ordem de Produção iniciada com sucesso!"),
                    {
                      buttons: [
                        {
                          id: "ok",
                          title: _t("Ok"),
                          type: "is-success",
                        },
                      ],
                    },
                    function () {
                      this.listarOrdens();
                    }.bind(this)
                  );
                }
              }.bind(this),
              {
                contentType: "json",
                timeout: 180000,
              }
            );
          }
        }
      }.bind(this)
    );
  }

  geraTabLotesEtiq(lotes, op, maquina, pos) {
    let linhasLote
    var lts = lotes.split(',')

    for (let i = 0; i < lts.length; i++) {
      const e = lts[i];

      linhasLote += `<tr>
                      <td>
                        ${ui.title(e == 'null' ? '' : e, { type: "title", size: 3 })} 
                      </td>
                      <td>
                        <a href="#" onclick="app.printEtiq('${op.split('/')[0]}', '${e}', '${app.appData.grupo}', '${pos}')"> 
                          <img src="./assets21/img/printerLabel.png" height=40px width=200px style="margin:0px 5%">
                          </img>
                        </a>
                      </td>
                    </tr>`
    }


    let html = `<style>
                  body {
                      font-family: Arial, sans-serif;
                      margin: 20px;
                  }
                  table {
                      width: 100%;
                      border-collapse: collapse;
                      margin-top: 20px;
                  }
                  table, th, td {
                      border: 1px solid black;
                  }
                  th, td {
                      padding: 10px;
                      text-align: left;
                  }
                  th {
                      background-color: #f2f2f2;
                  }
              </style>
                <table>
                <thead>
                    <tr>
                        <th>Lote</th>
                        <th>Imprimir</th>
                    </tr>
                </thead>
                <tbody>`

    html += linhasLote

    html += `</tbody>
          </table>`

    ux.dialog(_t("Imprimir Etiqueta"), html, { buttons: [{ id: 'ok', title: _t("Fechar"), type: "is-success" }] }
      , function (b) {
        if (b === 'ok') {

        }
      }.bind(this)
    );
  }

  geraDesDobradeira(op, src) {
    if (this.appData.dimensoes.length > 0) {
      let dim = this.appData.dimensoes.filter(x => x[0] == op)[0][1].split('@')
      let ang = this.appData.angulos.filter(x => x[0] == op)[0][1].split('@')
      let html = `<img id="img_item_zoom" src="${src}" style="height:70%;width:70%;"/><br>
                  <style>
                    body {
                        font-family: Arial, sans-serif;
                        margin: 20px;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 20px;
                    }
                    table, th, td {
                        border: 1px solid black;
                    }
                    th, td {
                        padding: 10px;
                        text-align: left;
                    }
                    th {
                        background-color: #f2f2f2;
                    }
                </style>
                  <table>
                  <thead>
                      <tr>
                          <th>Dimensões</th>
                          <th>Valor</th>
                          <th>Ángulos</th>
                          <th>Valor</th>
                      </tr>
                  </thead>
                  <tbody>`

      for (let i = 0; i < dim.length; i++) {
        const d = dim.filter(x => x.includes(`<b>D${i + 1}</b>`))
        const a = ang.filter(x => x.includes(`<b>A${i + 1}</b>`))

        //html += `<tr>${dim[i]}${ang[i]}</tr>`
        html += `<tr>${d}${a}</tr>`
      }

      html += `</tbody>
            </table>`;

      ux.dialog(_t("Dimensões / Ángulos"), html, { buttons: [{ id: 'ok', title: _t("Fechar"), type: "is-success" }] }
        , function (b) {
          if (b === 'ok') {

          }
        }.bind(this)
      );
    }
  }

  geraDesGuilhotina(op, src) {
    let desPC = this.appData.planocorte.filter(x => x[0] == op)
    let html = `<style>
                  body {
                      font-family: Arial, sans-serif;
                      margin: 20px;
                  }
                  table {
                      width: 100%;
                      border-collapse: collapse;
                      margin-top: 20px;
                  }
                  table, th, td {
                      border: 1px solid black;
                  }
                  th, td {
                      padding: 10px;
                      text-align: left;
                  }
                  th {
                      background-color: #f2f2f2;
                  }
              </style>
                <table>
                <thead>
                    <tr>
                        <th>Desenvolvimento</th>
                        <th>Item</th>
                    </tr>
                </thead>
                <tbody>`

    html += desPC[0][1]

    html += `</tbody>
          </table>
          <br><img id="img_item_zoom" src="${src}" style="height:70%;width:70%;"/>`;

    ux.dialog(_t("Plano de Corte"), html, { buttons: [{ id: 'ok', title: _t("Fechar"), type: "is-success" }] }
      , function (b) {
        if (b === 'ok') {

        }
      }.bind(this)
    );
  }

  getInfoLotes(lote) {

    var lts = lote.toString().split('/')

    let html = "<small><strong>Lista de Lotes Reservados: </strong></small><br>"

    html = html + `<table border="1" cellspacing="2" cellpadding="2" width="80%">
                        <tr>
                          <th align="center">Lote</th>
                          <th align="center">Item</th>
                          <th align="center">Saldo</th>
                        </tr>`

    lts.forEach(x => {
      html = html + `<tr>
                          <td>${x.toString().split('*')[0]}</td>
                          <td>${x.toString().split('*')[5]}</td>
                          <td>${parseFloat(x.toString().split('*')[1]).toFixed(2)}</td>
                       </tr>`
    })

    html = html + `</table>`

    ux.dialog(_t("Lotes Reservados"), html, { buttons: [{ id: 'ok', title: _t("Fechar"), type: "is-success" }] }
      , function (b) {
        if (b === 'ok') {

        }
      }.bind(this)
    );
  }

  initApto(lote, pesopc, buchnid, qtdblank, desenv, op, nr) {
    let rows = ux.dgrid("dgOrdens").rows.value;
    app.appData.opAtual = rows.filter((x) => x[0] == op.split("/")[0] && x[1] == op.split("/")[1]);
    app.appData.bloqTabApto = true
    ux.getElement("qtdPcReg").value = ""
    ux.getElement("pesoReg").value = ""
    ux.getElement("qtdBlank").value = ""
    ux.getElement("qtdRef").value = ""
    ux.getElement("txtItemAprov").value = ""
    ux.getElement("txtQuantAprov").value = ""
    ux.set('txtItemAprov', 'subtitle', '')
    ux.set('txtQuantAprov', 'subtitle', '')
    ux.set("qtdBlank", "enable")
    ux.set("pesoReg", "enable")
    ux.getElement("chkFinaliza").checked = false

    if (this.appData.grupo == "DESBOBINADOR") {
      this.appData.pesopc = pesopc
      ux.set("qtdPcReg", "enable")
      ux.set("qtdBlank", "disabled")
      ux.set("pesoReg", "enable")
    }

    if (this.appData.grupo == "GUILHOTINAS") {
      let currentRow = rows.filter((x) => x[0] == op.split("/")[0] && x[1] == op.split("/")[1]);
      let largUtil = parseFloat(currentRow[0][41]) || 0;
      this.appData.desenvTotal = largUtil > 0 ? largUtil : this.calculaDesenvTotal(op, nr);
      this.appData.pesopc = pesopc
      this.appData.quantBlank = qtdblank
      this.appData.desenvBlank = desenv
      ux.set("qtdPcReg", "enable")
      ux.set("qtdBlank", "enable")
      ux.set("pesoReg", "disabled")
    }

    if (this.appData.grupo == "PREN. DOBRADEIRA" || app.appData.grupo == "PREN. DOBRADEIRA 3 MT") {
      let currentRow = rows.filter((x) => x[0] == op.split("/")[0] && x[1] == op.split("/")[1]);

      let largUtil = parseFloat(currentRow[0][41]) || 0;
      // LargBobina (mm) — largura total da chapa pai INCLUINDO refilo.
      // Usado no cálculo do peso unitário do blank na dobradeira para manter
      // coerência entre pesoChapa (peso bruto, com refilo) e largura física.
      // ATENÇÃO: vem do SQL como string com ponto separador de milhar (ex: "1.212"
      // = 1212 mm). Remove o ponto antes do parseFloat — mesmo tratamento de larguraLote.
      let largBobinaRaw = currentRow[0][42];
      let largBobina = parseFloat(String(largBobinaRaw || '0').replace(/\./g, '')) || 0;

      if (largUtil > 1) {
        this.appData.desenvTotal = largUtil;
      } else {
        this.appData.desenvTotal = parseInt(qtdblank) * parseFloat(desenv);
        console.warn('LargUtil do SQL retornou 0 — usando desenvTotal parcial: ' + this.appData.desenvTotal);
      }
      this.appData.largBobina = largBobina;
      this.appData.pesopc = pesopc
      this.appData.quantBlank = qtdblank
      this.appData.desenvBlank = desenv
      ux.set("qtdPcReg", "disabled")
      ux.set("qtdBlank", "enable")
      ux.set("pesoReg", "disabled")
    }

    this.appData.buchnid = buchnid
    this.appData.lotesReservados = []
    var lts = lote.toString().split('/')
    ux.select("cbLoteReg").clear()

    this.appData.lotes = lts

    lts.forEach(x => {
      if (x != '') {
        ux.select("cbLoteReg").add(x.toString().split('*')[0], x.toString().split('*')[0] + ' - ' + x.toString().split('*')[5]);
        this.appData.lotesReservados.push([x.toString().split('*')[0], parseFloat(x.toString().split('*')[1]).toFixed(2)])
      }
    })

    ux.getElement("cbLoteReg").value = ""
    ux.tabs("MApp", 'active', 'tabApontamento')
    app.liberarBotaoSalvar();
    app.atualizaMsgPerda(0);
    // Carrega histórico dos últimos apontamentos desta OP (informativo, não bloqueia)
    app.loadHistoricoApto();
  }

  updatePesoChapaLote(absEntry, pesoChapa, qtdChapa) {
    ux.saveAll(`/odata4/v1/BatchNumber(${absEntry})`
      , {
        "U_SPS_PesoChapa": pesoChapa,
        "U_SPS_QtdChapa": qtdChapa
      }
      , function (err, result) {
        if (!err && !result.hasOwnProperty('error')) {

        } else {
          console.log('Error Saving the data... ' + result);
        }
      }.bind(this)
      , { method: 'PUT', contentType: 'json', timeout: 180000 }
    );
  }

  async stopOrder(buchnid, acao) {
    let op, pos, operacao, date, time, recurso, lotePA, issueL, receiptL, pesoChapa, qtdGood, qtdPA, qtdMP, qtdSucata, clsEntry;
    let rows = ux.dgrid("dgOrdens").rows.value;
    let row = rows.filter((x) => x[11] === buchnid);
    let rowData = row[0];
    var lotes = [rowData[18].toString().split("/") || rowData[18]];
    var lote = lotes[0].filter(item => item.includes(ux.getElement("cbLoteReg").value))
    let retSucata = false

    if (app.appData.grupo == "PREN. DOBRADEIRA" || app.appData.grupo == "PREN. DOBRADEIRA 3 MT") {
      qtdGood = parseInt(ux.getElement("qtdBlank").value)
      qtdPA = parseInt(ux.getElement("qtdBlank").value)
      qtdMP = parseFloat(parseFloat(ux.getElement("pesoReg").value) + parseFloat(ux.getElement("qtdRef").value || 0) * app.appData.pesoUnitBlank).toFixed(2)
    } else {
      if (rowData[10] == 'UNIDADE') {
        qtdGood = parseInt(ux.getElement("qtdPcReg").value)
        qtdPA = parseInt(ux.getElement("qtdPcReg").value)
        qtdMP = parseFloat(ux.getElement("pesoReg").value) + parseFloat(ux.getElement("qtdRef").value || 0)
      } else {
        qtdGood = parseInt(ux.getElement("qtdPcReg").value)
        qtdPA = parseFloat(ux.getElement("pesoReg").value || 0).toFixed(2)
        qtdMP = parseFloat(ux.getElement("pesoReg").value) + parseFloat(ux.getElement("qtdRef").value || 0)
      }
    }

    // =====================================================================
    // AJUSTE AUTOMÁTICO DE PESO RESIDUAL AO FINALIZAR APONTAMENTO
    // Quando "Finalizar Apontamento" está marcado e o saldo restante no lote
    // é irrisório (até 5 kg), ajusta o consumo para zerar o lote completamente.
    // Aplica-se somente a GUILHOTINAS e DOBRADEIRAS (no desbobinador não há essa variação).
    // =====================================================================
    if (acao !== 'stop' && ux.getElement("chkFinaliza").checked === true) {
      let saldoLote = parseFloat(ux.getElement("saldoReg").value) || 0;
      let saldoRestante = saldoLote - parseFloat(qtdMP);
      const MARGEM_KG = 5;

      if ((app.appData.grupo == "GUILHOTINAS"
        || app.appData.grupo == "PREN. DOBRADEIRA"
        || app.appData.grupo == "PREN. DOBRADEIRA 3 MT")
        && Math.abs(saldoRestante) <= MARGEM_KG
        && saldoRestante !== 0
        && saldoLote > 0) {

        let pesoRegAtual = parseFloat(ux.getElement("pesoReg").value) || 0;
        let pesoRegAjustado = pesoRegAtual + saldoRestante;

        console.log(`[AJUSTE RESIDUAL] Grupo: ${app.appData.grupo} | Saldo Lote: ${saldoLote} kg | qtdMP calculado: ${qtdMP} kg | Restante: ${saldoRestante.toFixed(2)} kg`);
        console.log(`[AJUSTE RESIDUAL] pesoReg: ${pesoRegAtual} → ${pesoRegAjustado.toFixed(2)} | qtdMP: ${qtdMP} → ${saldoLote}`);

        // Atualiza pesoReg com o ajuste
        ux.getElement("pesoReg").value = pesoRegAjustado.toFixed(2);

        // Recalcula qtdMP para consumir 100% do saldo
        qtdMP = saldoLote;

        // Para GUILHOTINAS com UM diferente de UNIDADE, qtdPA = pesoReg (em kg)
        if (app.appData.grupo == "GUILHOTINAS" && rowData[10] !== 'UNIDADE') {
          qtdPA = pesoRegAjustado.toFixed(2);
        }

        // qtdGood e qtdPA (quando em unidades/blanks) permanecem inalterados
        // pois a quantidade de peças não muda — apenas o peso consumido se ajusta
      }
    }

    //pesoChapa = parseFloat(ux.getElement("pesoReg").value||0).toFixed(2) / parseInt(ux.getElement("qtdPcReg").value||1)
    if (parseFloat(app.appData.pesochapa) == 0) {
      pesoChapa = parseFloat(ux.getElement("pesoReg").value || 0).toFixed(2) / parseInt(ux.getElement("qtdPcReg").value || 1)
    } else {
      pesoChapa = parseFloat(app.appData.pesochapa)
    }

    op = rowData[0];
    pos = rowData[1];
    operacao = rowData[2];
    date = rowData[12];
    time = rowData[13];
    recurso = rowData[14];

    if (this.appData.grupo == "DESBOBINADOR" && acao != 'stop') {
      if (rowData[22] == null || rowData[22] == '') {
        lotePA = lote.toString().split("*")[0] + '-' + this.appData.contLote[0][0] || 0
      } else {
        lotePA = rowData[22] + '-' + this.appData.contLote[0][0] || 0
      }

      //lotePA = rowData[22] == null ? lote.toString().split("*")[0] + '-' + this.appData.contLote[0][0]||0 : rowData[22] + '-' + this.appData.contLote[0][0]||0;
      if (lotePA.toString().split("-")[0] == '') {
        ux.dialog(
          _t("Erro de Apontamento."),
          _t("Erro ao gerar lote de produto acabado!"),
          {
            buttons: [
              {
                id: "fechar",
                title: _t("Fechar"),
                type: "is-danger",
              },
            ],
          },
          function () {

          }.bind(this)
        );
        return
      }

    }

    else {
      lotePA = rowData[22];
    }

    const pesoSaidaAprov = parseFloat(ux.getElement("saldoReg").value) - qtdMP
    const quantEntradaAprov = parseFloat(ux.getElement("txtQuantAprov").value)

    await ux.dialog(
      _t("Iniciar Ordem de Produção"),
      ui.title("Deseja realmente parar a Ordem?", {
        type: "title",
        size: 5,
      }) +
      "<small><strong>Nº da OP/Posição: </strong></small>" +
      op +
      "/" +
      pos,
      /*
       +
      `<center><span style="color: red; font-size: 25;"><b>##### ATENÇÃO ##### </b><br><br> Ao selecionar o tipo de apontamento "Completo", a ordem será encerrada e não poderá haver mais apontamentos nesta ordem.</span></center>`,
      */
      {
        buttons: [
          {
            id: "parcial",
            title: _t("Parcial"),
            type: "is-warning",
          },
          /*{
            id: "completo",
            title: _t("Completo"),
            type: "is-success",
          },*/
        ],
      },
      async function (b) {
        if (b == "parcial") {
          clsEntry = false
        }

        if (b == "completo") {
          clsEntry = true
        }

        if (b == "parcial" || b == "completo") {
          let bsl = ''
          let erro = false
          let msg = ''

          if (acao == 'stop') {
            bsl = {
              PersonnelId: appInfo.uid,
              TimeReceiptRunningId: buchnid,
              DocEntry: op,
              LineNumber: pos,
              LineNumber2: operacao,
              QuantityGood: 0,
              StartDate: date,
              StartTime: time,
              ResourceId: recurso,
              CalculateDuration: false,
              CloseEntry: false,
              Duration: 1
            };

            if (await this.execSave('TimeReceipt', bsl)) {
              msg = "Apontamento encerrado com sucesso."
            } else {
              erro = true
              msg = "Erro ao apontar produto acabado."
            }
          } else {
            let sucata = '', saida = '', receipt = ''

            //MONTA RECEIPT COM OU SEM LOTE
            if (this.appData.grupo == "PREN. DOBRADEIRA" || app.appData.grupo == "PREN. DOBRADEIRA 3 MT") {
              receipt = {
                Lines: [{
                  ItemCode: rowData[6].toString().split("-")[0].trim(),
                  WhsCode: rowData[21],
                  Quantity: parseFloat(qtdPA)
                }]
              }
            } else {
              receipt = {
                Lines: [{
                  ItemCode: rowData[6].toString().split("-")[0].trim(),
                  WhsCode: rowData[21],
                  U_SPS_PesoChapa: pesoChapa,
                  Quantity: parseFloat(qtdPA),
                  BatchNumbers: [{
                    DistNumber: lotePA,
                    Quantity: parseFloat(qtdPA)
                    //BatchAttribute1: parseFloat(ux.getElement("pesoReg").value) / parseInt(ux.getElement("qtdPcReg").value),
                  }]
                }
                ]
              }
            }
            if (parseFloat(ux.getElement("qtdRef").value || 0 > 0)) {
              if (this.appData.grupo == "PREN. DOBRADEIRA" || app.appData.grupo == "PREN. DOBRADEIRA 3 MT") {
                qtdSucata = parseFloat(ux.getElement("qtdRef").value * app.appData.pesoUnitBlank).toFixed(2)
              } else {
                qtdSucata = parseFloat(ux.getElement("qtdRef").value || 0)
              }

              sucata =
              {
                Transaction: "receiptwo",
                DocumentLines:
                  [
                    {
                      Base_DocEntry: op,
                      Base_LineNumber: pos,
                      BaseLineNumber2: 20,
                      ItemCode: rowData[28],
                      Quantity: parseFloat(qtdSucata),
                      WhsCode: rowData[21],
                    }
                  ]
              }

              saida =
              {
                Transaction: "issuewo",
                DocumentLines:
                  [
                    {
                      Base_DocEntry: op,
                      Base_LineNumber: pos,
                      BaseLineNumber2: parseInt(lote.toString().split("*")[4]),
                      ItemCode: lote.toString().split("*")[2],
                      WhsCode: lote.toString().split("*")[3],
                      Quantity: parseFloat(qtdMP),
                      BatchNumbers: [{
                        DistNumber: lote.toString().split("*")[0],
                        Quantity: parseFloat(qtdMP)
                      }]
                    }
                  ]
              }



              bsl = {
                PersonnelId: appInfo.uid,
                TimeReceiptRunningId: buchnid,
                DocEntry: op,
                LineNumber: pos,
                LineNumber2: operacao,
                StartDate: date,
                StartTime: time,
                QuantityGood: parseFloat(qtdGood),
                //QuantityScrap: parseFloat(qtdSucata),
                ResourceId: recurso,
                CalculateDuration: true,
                CloseEntry: clsEntry,
                ManualBooking: true,
                IntermediateReport: ux.getElement("chkFinaliza").checked == true ? false : true,
                Issue: {
                  Lines: [{
                    ItemCode: lote.toString().split("*")[2],
                    WhsCode: lote.toString().split("*")[3],
                    BaseLineNumber2: parseInt(lote.toString().split("*")[4]),
                    Quantity: parseFloat(qtdMP),
                    BatchNumbers: [{
                      DistNumber: lote.toString().split("*")[0],
                      Quantity: parseFloat(qtdMP)
                    }]
                  }]
                },
                Receipt: receipt
                /*Receipt: {
                 Lines: [{
                    ItemCode: rowData[6].toString().split("-")[0],
                    WhsCode: rowData[21],
                    U_SPS_PesoChapa: pesoChapa,
                    Quantity: parseFloat(qtdPA),
                    BatchNumbers: [{
                      DistNumber: lotePA,
                      Quantity: parseFloat(qtdPA)
                      //BatchAttribute1: parseFloat(ux.getElement("pesoReg").value) / parseInt(ux.getElement("qtdPcReg").value),
                    }]
                  }
                  ]
                }*/
              };

            } else {
              bsl = {
                PersonnelId: appInfo.uid,
                TimeReceiptRunningId: buchnid,
                DocEntry: op,
                LineNumber: pos,
                LineNumber2: operacao,
                StartDate: date,
                StartTime: time,
                QuantityGood: parseFloat(qtdGood),
                //QuantityScrap: parseFloat(qtdSucata),
                ResourceId: recurso,
                CalculateDuration: true,
                ManualBooking: true,
                CloseEntry: clsEntry,
                IntermediateReport: ux.getElement("chkFinaliza").checked == true ? false : true,
                Issue: {
                  Lines: [{
                    ItemCode: lote.toString().split("*")[2],
                    WhsCode: lote.toString().split("*")[3],
                    BaseLineNumber2: parseInt(lote.toString().split("*")[4]),
                    Quantity: parseFloat(qtdMP),
                    BatchNumbers: [{
                      DistNumber: lote.toString().split("*")[0],
                      Quantity: parseFloat(qtdMP)
                    }]
                  }]
                },
                Receipt: receipt
                /*Receipt: {
                 Lines: [{
                    ItemCode: rowData[6].toString().split("-")[0],
                    WhsCode: rowData[21],
                    U_SPS_PesoChapa: pesoChapa,
                    Quantity: parseFloat(qtdPA),
                    BatchNumbers: [{
                      DistNumber: lotePA,
                      Quantity: parseFloat(qtdPA)
                      //BatchAttribute1: parseFloat(ux.getElement("pesoReg").value) / parseInt(ux.getElement("qtdPcReg").value),
                    }]
                  }
                  ]
                }*/
              };
            }



            if (sucata != '') {
              /*
              await this.execSave('issuewo', saida).then(async (res) => {
                if (res) {
                  await this.execSave('issuewo', saida).then(async (res) => {
                    if (res) {
                      await this.execSave('TimeReceipt', bsl).then((res) => {
                        if (res) {
                          msg = "Apontamento realizado com sucesso."
                        }else{
                          erro = true
                          msg = "Erro ao apontar produto acabado."
                        }
                      })
                    }else{
                      erro = true
                      msg = "Erro ao apontar sucata."
                    }
                  })
                }else{
                  erro = true
                  msg = "Erro ao apontar saida."
                }
              })
              */


              if (await this.execSave('receiptwo', sucata)) {
                if (await this.execSave('TimeReceipt', bsl)) {
                  if ((ux.getElement("txtItemAprov").value != '' && ux.getElement("txtItemAprov").value != null)
                    && ux.getElement("txtQuantAprov").value > 0) {
                    await app.execAproveitamento(lote.toString().split("*")[2], lote.toString().split("*")[0], pesoSaidaAprov, ux.getElement("txtItemAprov").value, quantEntradaAprov, op, pos)
                  }
                  msg = "Apontamento realizado com sucesso."
                } else {
                  erro = true
                  msg = "Erro ao apontar produto acabado."
                }
              } else {
                erro = true
                msg = "Erro ao apontar sucata."
              }

              /*
              await ux.saveAll(
                "/odata4/v1/Receipt?$ProgramId=" +
                appInfo.gid +
                "&$AppId=" +
                appInfo.appID,
                sucata,
                function (err, result) {
                  if (!ux.aError(result, false)) {
                    ux.saveAll(
                      "/odata4/v1/TimeReceipt?$ProgramId=" +
                      appInfo.gid +
                      "&$AppId=" +
                      appInfo.appID,
                      bsl,
                      function (err, result) {
                        if (!ux.aError(result, false)) {
                          ux.dialog(
                            _t("Inicio de Ordem"),
                            _t("Ordem de Produ��o Parada com sucesso!"),
                            {
                              buttons: [
                                {
                                  id: "ok",
                                  title: _t("Ok"),
                                  type: "is-success",
                                },
                              ],
                            },
                            function () {
                              //this.app_dataClear();
                              //this.printEtiq(op, lotePA, app.appData.grupo, pos)
                              this.listarOrdens();
                            }.bind(this)
                          );
                        }
                      }.bind(this),
                      {
                        contentType: "json",
                        timeout: 180000,
                      }
                    );
                  } else {
                    ux.dialog(_t("Erro de Apontamento de Sucata"), _t("N�o foi possivel apontar a sucata para esta Ordem de Produ��o."),
                      {
                        buttons: [
                          {
                            id: "ok",
                            title: _t("Fechar"),
                            type: "is-danger",
                          },
                        ],
                      },
                      function () {

                      }.bind(this)
                    );
                  }
                }.bind(this),
                {
                  contentType: "json",
                  timeout: 180000,
                }
              );*/
            } else {

              if (await this.execSave('TimeReceipt', bsl)) {
                if ((ux.getElement("txtItemAprov").value != '' && ux.getElement("txtItemAprov").value != null)
                  && ux.getElement("txtQuantAprov").value > 0) {
                  await app.execAproveitamento(lote.toString().split("*")[2], lote.toString().split("*")[0], pesoSaidaAprov, ux.getElement("txtItemAprov").value, quantEntradaAprov, op, pos)
                }
                msg = "Apontamento realizado com sucesso."
              } else {
                erro = true
                msg = "Erro ao apontar produto acabado."
              }
            }
          }

          if (erro) {
            ux.dialog(_t("Erro de Apontamento"), _t(msg),
              {
                buttons: [
                  {
                    id: "ok",
                    title: _t("Fechar"),
                    type: "is-danger",
                  },
                ],
              },
              function () {

              }.bind(this)
            );
          } else {
            ux.dialog(
              _t("Término de Ordem"),
              _t(msg),
              {
                buttons: [
                  {
                    id: "ok",
                    title: _t("Ok"),
                    type: "is-success",
                  },
                ],
              },
              function () {
                app.listarOrdens();
              }.bind(this)
            );
          }
        }
      }.bind(this)
    );
  }

  async execSave(action, bsl) {
    ux.apost(
      `/odata4/v1/${action}?$ProgramId=` +
      appInfo.gid +
      "&$AppId=" +
      appInfo.appID,
      bsl,
      function (err, result) {
        if (!ux.aError(result, false)) {
          return true
        } else {
          return false
        }
      }.bind(this),
      {
        contentType: "json",
        timeout: 180000,
      }
    );

    await ux.wait();
    return await Promise.resolve(true);
  }

  printEtiqFromApto() {
    if (!app.appData.opAtual || app.appData.opAtual.length === 0) {
      ux.dialog("Atenção", "Nenhuma ordem selecionada. Selecione uma ordem na Lista de Ordens antes de imprimir.", {
        buttons: [{ id: 'ok', title: _t("Fechar"), type: "is-danger" }]
      });
      return;
    }

    let dr = app.appData.opAtual[0];
    let lotesEtiq = dr[30];
    let grupo = app.appData.grupo;

    // Verifica disponibilidade de lotes conforme a regra de cada grupo
    let temLote = false;
    if (grupo === "GUILHOTINAS" || grupo === "DESBOBINADOR") {
      temLote = (lotesEtiq != null && lotesEtiq !== undefined);
    } else {
      // PREN. DOBRADEIRA / PREN. DOBRADEIRA 3 MT: dr[31] = produzido
      temLote = (dr[31] > 0);
    }

    if (!temLote) {
      ux.dialog("Atenção", "Nenhum lote disponível para impressão nesta ordem.", {
        buttons: [{ id: 'ok', title: _t("Fechar"), type: "is-warning" }]
      });
      return;
    }

    // maquina: 1 = guilhotina (com apto ativo), 2 = dobradeira (com apto ativo), 0 = demais
    let maquina = 0;
    if (grupo === "GUILHOTINAS" && app.appData.buchnid) maquina = 1;
    else if ((grupo === "PREN. DOBRADEIRA" || grupo === "PREN. DOBRADEIRA 3 MT") && app.appData.buchnid) maquina = 2;

    app.geraTabLotesEtiq(lotesEtiq, dr[3], maquina, dr[1]);
  }

  async execAproveitamento(mpcode, mplote, mpqtd, pacode, paqtd, op, pos) {
    ux.aget('?program_id=' + appInfo.gid + '&page=' + appInfo.appID + '&get=aproveitamento&mpcode=' + mpcode + '&mplote=' + mplote + '&mpqtd=' + mpqtd + '&pacode=' + pacode + '&paqtd=' + paqtd + '&op=' + op + '&pos=' + pos
      , function (err, result) {
        if (!ux.aError(result, true)) {
          ux.dialog(_t("Apontamento de Aproveitamento de Chapa!"), "Aproveitamento realizado com sucesso!", { buttons: [{ id: 'ok', title: _t("Fechar"), type: "is-success" }] }
            , function (b) {
              app.listarOrdens();
            }.bind(this)
          );
        }
      }
      , { timeout: 180000 }
    );
  }

  async eventInterruption(resource, interruptionId) {
    //REGISTRAR PARADA!
    if (interruptionId) {
      let html = "";
      html += "Deseja Encerrar a Interrupção?"
      ux.dialog(_t("Registro de Parada!"), html, { buttons: [{ id: 'ok', title: _t("Ok"), type: "is-success" }, { id: 'canc', title: _t("Cancelar"), type: "is-danger" }] }
        , function (b) {
          if (b === 'ok') {
            app.stopInterruption(resource, interruptionId);
          }
        }.bind(this)
      );

    } else {

      if (this.appData.interrupReasons.length > 0) {
        let d = this.appData.interrupReasons;
        let html = "";
        let col = 0
        let limitCols = 3
        let buttons = [];
        let buttonsList = [];

        d.forEach(x => {

          let buttonHtml = { content: `<button style="width:95%;  text-shadow: 2px 2px black; color:white; height:3em; font-size:28; background-color:${(x[2] || '') ? x[2] : '#808080'}" onclick="app.startInterruption('${resource}', '${x[0]}', '${x[1]}')">${x[0]}<br>${x[1]}</button>` }
          buttons[col] = buttonHtml;

          col += 1;
          if (col === limitCols) {
            col = 0;
            buttonsList.push(buttons);
            buttons = [];
          }
        });
        if (buttons) {

          for (let i = buttons.length; i < limitCols; i++) {
            buttons[i] = { content: '' };
          }

          buttonsList.push(buttons);
          buttons = [];
        }
        buttonsList.forEach(x => {
          html += ui.columns(x);
        });
        ux.dialog(_t("Registro de Parada!"), html);
      }
      else {
        ux.dialog(_t("Nenhum Motivo Encontrado"), "Nenhum Motivo Encontrado", { buttons: [{ id: 'ok', title: _t("Ok"), type: "is-danger" }] });
      }

    }
  }

  //SPS-ALISSON
  startInterruption(resource, id, desc) {
    document.getElementById("ui_mbox").remove();
    let bsl = {
      "action": "start",
      "ResourceType": "resource",
      "ResourceId": resource,
      "InterruptionId": 0,
      "InterruptionReasonId": id,
      "ReasonInfo": desc,
    };
    ux.apost('/odata4/v1/Interruption?$ProgramId=' + appInfo.gid + '&$AppId=' + appInfo.appID
      , bsl
      , function (err, result) {
        if (!ux.aError(result, false)) {
          this.listarOrdens();
        }
      }.bind(this)
      , { contentType: 'json', timeout: 180000 }
    );
  }

  //SPS - ALISSON
  stopInterruption(resource, interruptionId) {
    let bsl = {
      action: "stop",
      ResourceId: resource,
      InterruptionId: parseInt(interruptionId)
    };

    console.log("JDG :: Saving interruption", bsl);
    ux.apost('/odata4/v1/Interruption?$ProgramId=' + appInfo.gid + '&$AppId=' + appInfo.appID
      , bsl
      , function (err, result) {
        if (!ux.aError(result, false)) {
          this.listarOrdens();
        }
      }.bind(this)
      , { contentType: 'json', timeout: 180000 }
    );
  }

  imageDialog(src, title) {
    ux.dialog(
      title,
      `<img id="img_item_zoom" src="${src}" style="height:70%;width:70%;"/>`,
      { buttons: [{ id: "ok", title: _t("OK"), type: "is-success" }] }
    );
  }
  liberarBotaoSalvar() {
    let btn = document.getElementById("btnSalvarRegistro");
    let msg = document.getElementById("msgAlertaPeso");
    if (btn && msg) {
      btn.disabled = false;
      btn.style.backgroundColor = "#1927AA";
      btn.style.cursor = "pointer";
      msg.style.display = "none";
    }
  }

  // Atualiza o aviso visual de blanks que foram para a sucata.
  // Recebe a quantidade de blanks perdidos (totalTeórico - blanksProduzidos).
  // Mostra "* X perda(s)" em vermelho abaixo da linha de inputs, ou esconde se 0.
  atualizaMsgPerda(qtdPerda) {
    let msg = document.getElementById("msgPerda");
    if (!msg) return;
    if (qtdPerda && qtdPerda > 0) {
      msg.innerText = `* ${qtdPerda} ${qtdPerda === 1 ? 'perda' : 'perdas'} → sucata`;
      msg.style.display = "block";
    } else {
      msg.innerText = "";
      msg.style.display = "none";
    }
  }

  // Carrega os últimos N apontamentos da OP corrente via GetHistoricoApontamentos
  // (ação a ser adicionada em BEAS_WEBAPP_MODOUTROS_AUX). Falha silenciosamente se
  // a procedure não existir ou retornar vazio — operador segue trabalhando.
  async loadHistoricoApto() {
    let opAtual = (app.appData.opAtual && app.appData.opAtual[0]) || [];
    let belnr = opAtual[0]; let belpos = opAtual[1]; let pos = opAtual[2];
    if (!belnr || belpos == null) {
      app.appData.historicoApto = [];
      app.renderHistoricoApto();
      return;
    }
    let limite = app.config.HISTORICO_MAX_REGISTROS || 5;
    try {
      await this.executaProcAux(
        'GetHistoricoApontamentos',
        belnr, belpos, pos || 0,
        [String(limite), '', '', '', '', '', '', '', '', ''],
        'historicoApto'
      );
    } catch (e) {
      app.appData.historicoApto = [];
    }
    app.renderHistoricoApto();
  }

  // Renderiza a tabela de histórico no painel #painelHistorico.
  // Espera que app.appData.historicoApto seja um array de linhas no formato:
  //   [DataHora, QtdGood, QtdSucata, Operador]
  // (mesmas colunas e ordem que o SQL GetHistoricoApontamentos retorna)
  renderHistoricoApto() {
    let painel = document.getElementById("painelHistorico");
    if (!painel) return;
    let dados = app.appData.historicoApto || [];
    if (!Array.isArray(dados) || dados.length === 0) {
      painel.style.display = "none";
      painel.innerHTML = "";
      return;
    }

    let linhas = dados.map(row => {
      let dataHora = row[0] != null ? String(row[0]) : '—';
      let qtdGood = row[1] != null ? String(row[1]) : '0';
      let qtdSucata = row[2] != null ? Number(row[2]) : 0;
      let operador = row[3] != null ? String(row[3]) : '—';
      let sucataCell = qtdSucata > 0
        ? `<span style="color:#d32f2f; font-weight:bold;">${qtdSucata}</span>`
        : '0';
      return `<tr>
        <td style="padding:6px 10px; border-bottom:1px solid #eee;">${dataHora}</td>
        <td style="padding:6px 10px; border-bottom:1px solid #eee; text-align:right;">${qtdGood}</td>
        <td style="padding:6px 10px; border-bottom:1px solid #eee; text-align:right;">${sucataCell}</td>
        <td style="padding:6px 10px; border-bottom:1px solid #eee;">${operador}</td>
      </tr>`;
    }).join('');

    painel.innerHTML = `
      <div style="font-size:13px; font-weight:bold; color:#555; margin-bottom:6px;">
        Últimos ${dados.length} apontamentos desta OP
      </div>
      <table style="width:100%; border-collapse:collapse; font-size:13px;">
        <thead>
          <tr style="background:#eaeaea; color:#333;">
            <th style="padding:6px 10px; text-align:left;">Data/Hora</th>
            <th style="padding:6px 10px; text-align:right;">Boas</th>
            <th style="padding:6px 10px; text-align:right;">Sucata</th>
            <th style="padding:6px 10px; text-align:left;">Operador</th>
          </tr>
        </thead>
        <tbody>${linhas}</tbody>
      </table>
    `;
    painel.style.display = "block";
  }

  validaPeso() {
    if (!app.appData.opAtual || app.appData.opAtual.length === 0) return;

    let opAtual = app.appData.opAtual[0];
    let grupo = app.appData.grupo;
    let pesoTeoricoUnitario = 0;
    let pesoApontadoUnitario = 0;

    let pesoRegStr = ux.getElement("pesoReg").value || "";
    let pesoReg = parseFloat(pesoRegStr.toString().replace(",", ".")) || 0;
    let qtdPcReg = parseFloat(ux.getElement("qtdPcReg").value) || 0;
    let qtdBlank = parseFloat(ux.getElement("qtdBlank").value) || 0;

    // Se o peso apontado for 0, libera para não travar apontamentos parciais vazios
    if (pesoReg === 0) {
      app.liberarBotaoSalvar();
      return;
    }

    // Identificação do peso teórico e cálculo do peso unitário apontado baseado na operação
    if (grupo === "GUILHOTINAS") {
      // SQL: dr[19]="Total", dr[25]="QtdBlank", dr[26]="QtdChap"
      let pesoTotalTeorico = parseFloat(opAtual[19]) || 0;
      let qtdBlankTeorico = parseFloat(opAtual[25]) || 0;
      let qtdChapTeorico = parseFloat(opAtual[26]) || 0;

      if (qtdBlankTeorico * qtdChapTeorico > 0) {
        pesoTeoricoUnitario = pesoTotalTeorico / (qtdBlankTeorico * qtdChapTeorico);
      }
      if (qtdBlank > 0) pesoApontadoUnitario = pesoReg / qtdBlank;

    } else if (grupo === "PREN. DOBRADEIRA" || grupo === "PREN. DOBRADEIRA 3 MT") {
      // SQL: dr[20]="PesoPeça"
      pesoTeoricoUnitario = parseFloat(opAtual[20]) || 0;
      if (qtdBlank > 0) pesoApontadoUnitario = pesoReg / qtdBlank;

    } else if (grupo === "DESBOBINADOR") {
      // SQL: dr[24]="PesoChapa"
      pesoTeoricoUnitario = parseFloat(opAtual[24]) || 0;
      if (qtdPcReg > 0) pesoApontadoUnitario = pesoReg / qtdPcReg;
    }

    let btn = document.getElementById("btnSalvarRegistro");
    let msg = document.getElementById("msgAlertaPeso");

    if (pesoTeoricoUnitario > 0 && pesoApontadoUnitario > 0) {
      // Calcula a variação percentual entre o peso unitário apontado e o teórico.
      let variacao = Math.abs((pesoApontadoUnitario - pesoTeoricoUnitario) / pesoTeoricoUnitario);
      let limite = app.config.LIMITE_VARIACAO_PESO;
      let limitePct = (limite * 100).toFixed(0);

      if (variacao > limite) {
        if (btn && msg) {
          btn.disabled = true;
          btn.style.backgroundColor = "#cccccc";
          btn.style.cursor = "not-allowed";
          msg.innerText = `⚠️ Apontamento bloqueado: Variação de peso unitário (${(variacao * 100).toFixed(2)}%) excede o limite de ${limitePct}%.\nPeso Unitário Teórico: ${pesoTeoricoUnitario.toFixed(4)} kg | Peso Unitário Apontado: ${pesoApontadoUnitario.toFixed(4)} kg.`;
          msg.style.display = "block";
        }
      } else {
        app.liberarBotaoSalvar();
      }
    } else {
      app.liberarBotaoSalvar();
    }
  }
  // Calcula informações sobre perdas no apontamento atual.
  // Retorna { qtdPerda, qtdEsperada, percentual, pesoPerdaKg } ou null se não há perda.
  // Usado pelo salvaRegistro para decidir se pede confirmação ao operador.
  getPerdaInfo() {
    let grupo = app.appData.grupo;
    let qtdEsperada = 0;
    let qtdPerda = 0;
    let pesoUnit = parseFloat(app.appData.pesoUnitBlank) || 0;

    if (grupo === "GUILHOTINAS") {
      let chapas = parseInt(ux.getElement("qtdPcReg").value) || 0;
      let blanksPorChapa = parseInt(app.appData.quantBlank) || 0;
      let qtdBlankInformado = parseInt(ux.getElement("qtdBlank").value) || 0;
      qtdEsperada = chapas * blanksPorChapa;
      qtdPerda = qtdEsperada - qtdBlankInformado;
    } else if (grupo === "PREN. DOBRADEIRA" || grupo === "PREN. DOBRADEIRA 3 MT") {
      // Na dobradeira, perdas só viram sucata se Finalizar marcado.
      let chk = document.getElementById("chkFinaliza");
      if (!chk || !chk.checked) return null;
      let opAtual = (app.appData.opAtual && app.appData.opAtual[0]) || [];
      let mengeOP = parseFloat(opAtual[7]) || 0;
      let produzidoOP = parseFloat(opAtual[8]) || 0;
      qtdEsperada = mengeOP - produzidoOP;
      if (qtdEsperada <= 0) qtdEsperada = mengeOP;
      let qtdBlankInformado = parseInt(ux.getElement("qtdBlank").value) || 0;
      qtdPerda = qtdEsperada - qtdBlankInformado;
    } else {
      return null;
    }

    if (qtdPerda <= 0 || qtdEsperada <= 0) return null;

    return {
      qtdPerda: qtdPerda,
      qtdEsperada: qtdEsperada,
      percentual: qtdPerda / qtdEsperada,
      pesoPerdaKg: qtdPerda * pesoUnit,
    };
  }
  validaTempo() {
    let opAtual = (app.appData.opAtual && app.appData.opAtual[0]) || [];
    let dataInicioStr = opAtual[12];
    let horaInicioStr = opAtual[13];

    if (!dataInicioStr || !horaInicioStr) {
      return {
        ok: false,
        segundosDecorridos: 0,
        msg: "Esta OP não tem horário de início registrado. Inicie a OP na máquina antes de apontar — caso contrário o BEAS pode baixar o insumo sem registrar o produto acabado.",
      };
    }

    let inicio = new Date(dataInicioStr.replace(/\//g, '-') + 'T' + horaInicioStr + ':00');
    if (isNaN(inicio.getTime())) {
      return { ok: true, segundosDecorridos: -1, msg: "" };
    }

    let inicioConservador = inicio.getTime() + 60 * 1000;
    let segundos = Math.floor((Date.now() - inicioConservador) / 1000);
    let minimo = app.config.TEMPO_MINIMO_APTO_SEG;

    if (segundos < minimo) {
      let faltam = Math.max(1, minimo - segundos);
      return {
        ok: false,
        segundosDecorridos: segundos,
        msg: `Aguarde ${faltam} segundo(s) antes de apontar.\n\nA OP foi iniciada agora (${horaInicioStr}). Apontar muito rápido faz o sistema baixar o insumo sem registrar o produto acabado, gerando inconsistência de estoque.`,
      };
    }

    return { ok: true, segundosDecorridos: segundos, msg: "" };
  }

  salvaRegistro() {
    let chkTempo = this.validaTempo();
    if (!chkTempo.ok) {
      ux.dialog("Aguarde", chkTempo.msg, {
        buttons: [{ id: "ok", title: _t("OK"), type: "is-warning" }]
      });
      return;
    }

    this.validaPeso();

    let btn = document.getElementById("btnSalvarRegistro");
    if (btn && btn.disabled) {
      let limitePct = (app.config.LIMITE_VARIACAO_PESO * 100).toFixed(0);
      ux.dialog("Atenção", `O apontamento está bloqueado devido à variação de peso exceder ${limitePct}%. Por favor, ajuste o peso apontado ou as quantidades.`, { buttons: [{ id: "ok", title: _t("OK"), type: "is-danger" }] });
      return; // Interrompe o processo e impede o envio ao SAP/Beas
    }

    // Confirmação ao salvar com perda acima do limite (proteção contra dedo gordo).
    // Ex.: operador digita 100 em vez de 340 — antes de mandar 240 peças pra sucata,
    // pede confirmação explícita mostrando os números.
    let perda = this.getPerdaInfo();
    let limitePerda = app.config.LIMITE_PERDA_CONFIRMACAO;
    if (perda && perda.percentual > limitePerda) {
      let pctStr = (perda.percentual * 100).toFixed(1);
      let pesoStr = perda.pesoPerdaKg > 0 ? `≈ ${perda.pesoPerdaKg.toFixed(1)} kg` : '';
      let html = `
        <div style="font-size:15px; line-height:1.5;">
          <p>Este apontamento vai registrar:</p>
          <table style="width:100%; margin:10px 0; border-collapse:collapse;">
            <tr style="background:#fff3e0;">
              <td style="padding:8px; border:1px solid #ffb74d;"><b>Perdas → sucata</b></td>
              <td style="padding:8px; border:1px solid #ffb74d; text-align:right;"><b>${perda.qtdPerda} peça(s) ${pesoStr}</b></td>
            </tr>
            <tr>
              <td style="padding:8px; border:1px solid #ddd;">Esperado</td>
              <td style="padding:8px; border:1px solid #ddd; text-align:right;">${perda.qtdEsperada} peça(s)</td>
            </tr>
            <tr>
              <td style="padding:8px; border:1px solid #ddd;">% de perda</td>
              <td style="padding:8px; border:1px solid #ddd; text-align:right; color:#d32f2f;"><b>${pctStr}%</b></td>
            </tr>
          </table>
          <p style="color:#d32f2f;">A perda excede o limite de ${(limitePerda * 100).toFixed(0)}%. Confirmar mesmo assim?</p>
        </div>
      `;
      ux.dialog("Confirmar Apontamento com Perda", html, {
        buttons: [
          { id: "ok", title: _t("Confirmar"), type: "is-warning" },
          { id: "canc", title: _t("Cancelar"), type: "is-light" },
        ]
      }, function (b) {
        if (b === 'ok') {
          app.stopOrder(app.appData.buchnid, 'apto');
        }
        // Se cancelar, não faz nada — operador volta para a tela e ajusta.
      });
      return;
    }

    this.stopOrder(this.appData.buchnid, 'apto');
  }

  async executaProcAux(acao, belnr, belpos, pos, params, rowsAttribute) {
    if (rowsAttribute) {
      app.appData[rowsAttribute] = [];
    }
    return new Promise((resolve) => {
      ux.aget('?program_id=' + appInfo.gid + '&page=' + appInfo.appID + '&get=procAux&acao=' + acao +
        '&belnr=' + belnr + '&belpos=' + belpos + '&pos=' + pos +
        '&param1=' + params[0] + '&param2=' + params[1] + '&param3=' + params[2] +
        '&param4=' + params[3] + '&param5=' + params[4] + '&param6=' + params[5] +
        '&param7=' + params[6] + '&param8=' + params[7] + '&param9=' + params[8] +
        '&param10=' + params[9]
        , function (err, result) {
          if (!ux.aError(result, true)) {
            if (result && result.value && result.value.length > 0) {
              if (rowsAttribute) app.appData[rowsAttribute] = result.value;
            }
          } else {
            console.log(result && result.message);
          }
          resolve();
        }
        , { timeout: 180000 }
      );
    });
  }
}

var app = new customAPP();
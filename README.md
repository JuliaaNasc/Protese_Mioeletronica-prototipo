# Hand Prosthesis Simulator — Protótipo de estudos

> ⚠️ **Este projeto é um protótipo e um teste para estudos.**
> Não é um produto real nem um dispositivo médico. Todos os números (força, latência, peso, etc.) são fictícios.

Projeto criado por **Julia Nascimento** para praticar React, TypeScript e gráficos 3D no navegador com Three.js.

## O que o protótipo faz

- Mão robótica 3D montada com formas simples (sem modelos externos)
- Controle da flexão de cada dedo, do punho e da potência do motor
- 7 padrões de preensão prontos e um modo demo
- Acabamentos (carbono, titânio, cerâmica) e cores de LED
- Modo raio-X e vista explodida
- Telemetria simulada (sinal EMG, força, consumo)
- Temas Dark, Light e Glass
- Link compartilhável e exportação da configuração em JSON

## Tecnologias estudadas

- [React](https://react.dev) + [TypeScript](https://www.typescriptlang.org)
- [Vite](https://vite.dev)
- [Three.js](https://threejs.org) com [@react-three/fiber](https://r3f.docs.pmnd.rs) e [@react-three/drei](https://drei.docs.pmnd.rs)
- [Tailwind CSS v4](https://tailwindcss.com)

## Como rodar

```bash
npm install
npm run dev
```

Build de produção:

```bash
npm run build
npm run preview
```

## Atalhos

| Tecla | Ação               |
| ----- | ------------------ |
| 1–7   | Padrões de preensão |
| X     | Raio-X             |
| E     | Vista explodida    |
| D     | Modo demo          |

## Estrutura

```
src/
├── App.tsx                  # Página, temas, atalhos e compartilhamento
├── types.ts                 # Tipos do simulador
├── data/presets.ts          # Preensões, acabamentos e cores
└── components/
    ├── HandModel.tsx        # Modelo 3D da mão e animações
    ├── Scene.tsx            # Canvas, luzes e câmera
    ├── ControlPanel.tsx     # Painel de controles
    └── Telemetry.tsx        # Telemetria simulada
```

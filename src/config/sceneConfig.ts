import { DEFAULT_AGENT_ID } from '../utils/constants';

export const NEW_STREAM_CONFIGS = {
  "id": 0,
  "title": "Trump stream",
  "agentId": DEFAULT_AGENT_ID,
  "twitter": "@bor_live",
  "modelName": "Trump",
  "identifier": "Trump",
  "description": "My first stream!",
  "color": "#FE2C55",
  "type": "stream",
  "component": "ThreeScene",
  "creator": {
    "avatar": "/images/borp.webp",
    "title": "Just hanging out",
    "username": "Borp"
  },
  "bgm": "BGM_URLS.BORP.DEFAULT",
  "sceneConfigs": [
    {
      "id": 0,
      "name": "Cafe",
      "environmentURL": "tt.glb",
      "models": [
        {
          "model": "tromp.vrm",
          "name": "Bor",
          "agentId": DEFAULT_AGENT_ID,
          "description": "Bor",
          "clothes": "casual",
          "defaultAnimation": "idlet",
          "modelPosition": [
            1.51,
            -0.4999999999999999,
            -7.650000000000005
          ],
          "modelRotation": [
            0,
            7.799999999999988,
            0
          ],
          "modelScale": [
            0.9605960100000004,
            0.9605960100000004,
            0.9605960100000004
          ]
        }
      ],
      "environmentScale": [
        1,
        1,
        1
      ],
      "environmentPosition": [
        3,
        -1,
        -3.5
      ],
      "environmentRotation": [
        0,
        1.5707963267948966,
        0
      ],
      "cameraPitch": 0,
      "cameraPosition": [
        2.86339364354024,
        1.6599999999999906,
        -7.734076601144114
      ],
      "cameraRotation": -4.708758241001718
    }
  ],
  "stats": {
    "comments": 0
  },
  "clothes": "casual"
};
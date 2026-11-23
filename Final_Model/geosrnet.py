
import torch
import torch.nn as nn

class ResBlock(nn.Module):
    def __init__(self):
        super().__init__()
        self.net = nn.Sequential(
            nn.Conv2d(48,48,3,padding=1),
            nn.ReLU(inplace=True),
            nn.Conv2d(48,48,3,padding=1)
        )

    def forward(self,x):
        return x + 0.1*self.net(x)

class GeoSRNet(nn.Module):
    def __init__(self):
        super().__init__()
        self.head = nn.Conv2d(4,48,3,padding=1)
        self.body = nn.Sequential(*[ResBlock() for _ in range(8)])
        self.up = nn.Sequential(
            nn.Conv2d(48,192,3,padding=1), nn.PixelShuffle(2), nn.ReLU(),
            nn.Conv2d(48,192,3,padding=1), nn.PixelShuffle(2), nn.ReLU()
        )
        self.tail = nn.Conv2d(48,4,3,padding=1)

    def forward(self,x):
        f = self.head(x)
        f = f + self.body(f)
        return nn.functional.interpolate(
            x,scale_factor=4,mode="bicubic",align_corners=False
        ) + self.tail(self.up(f))

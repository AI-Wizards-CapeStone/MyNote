import torch
import torchvision.models as models
import numpy as np
import torch.nn as nn
from src.utils import makeDict
class DensenetEncoder(nn.Module) :
    def __init__ (self) :
        super(DensenetEncoder, self).__init__()
        self.cnn_encoder = nn.Sequential(
            nn.Conv2d(3, 64, 3, 1, 1),
            nn.ReLU(),
            nn.MaxPool2d(2, 2, 1),

            nn.Conv2d(64, 128, 3, 1, 1),
            nn.ReLU(),
            nn.MaxPool2d(2, 2, 1),

            nn.Conv2d(128, 256, 3, 1, 1),
            nn.ReLU(),
            nn.Conv2d(256, 256, 3, 1, 1),
            nn.ReLU(),
            nn.MaxPool2d((2, 1), (2, 1), 0),

            nn.Conv2d(256, 512, 3, 1, 0),
            nn.ReLU()
        )

        channel_seq = [3, 32, 64, 128, 256, 512]
        num_conv_pool = 5

        enc_layers = []

        for i in range(num_conv_pool):
            enc_layers.append(('conv2d', {'in_channels': channel_seq[i], 'out_channels': channel_seq[i+1], 'kernel_size': 5}))
            enc_layers.append(('maxpool2d', {'kernel_size': 2}))

        enc_layers.append(('avgpool2d', {'kernel_size': (3,3)}))

        self.layers = nn.ModuleList()

        for layer_type, layer_params in enc_layers:
            if layer_type == 'conv1d':
                self.layers.append(nn.Conv1d(**layer_params))
            elif layer_type == 'conv2d':
                self.layers.append(nn.Conv2d(**layer_params))
            elif layer_type == 'maxpool1d':
                self.layers.append(nn.MaxPool1d(**layer_params))
            elif layer_type == 'maxpool2d':
                self.layers.append(nn.MaxPool2d(**layer_params))
            elif layer_type == 'avgpool1d':
                self.layers.append(nn.AvgPool1d(**layer_params))
            elif layer_type == 'avgpool2d':
                self.layers.append(nn.AvgPool2d(**layer_params))
            elif layer_type == 'linear':
                self.layers.append(nn.Linear(**layer_params))
            elif layer_type == 'dropout':
                self.layers.append(nn.Dropout(**layer_params))
            else:
                raise ValueError(f'Invalid layer type: {layer_type}')

    def forward(self, input):
        for layer in self.layers:
            input = layer(input)
        return input
    
class LSTMDecoder(nn.Module):
    def __init__(self,  input_size=512, hidden_size=512):
        super(LSTMDecoder, self).__init__()
        tok_dict, _, _ = makeDict()
        self.vec_size = len(tok_dict)

        self.embedding = nn.Embedding(self.vec_size, hidden_size)
        self.lstm = nn.LSTM(input_size+hidden_size, hidden_size, batch_first=True)
        self.projection = nn.Linear(hidden_size, self.vec_size)

    def forward(self, input, hidden):

        if hidden is None:
            output, hidden = self.lstm(input)
        else:
            output, hidden = self.lstm(input, hidden)
        output = self.projection(output)

        return output, hidden
    
class LATEXX(nn.Module):
    def __init__(self, encoder=DensenetEncoder(), decoder=LSTMDecoder()):
        super(LATEXX, self).__init__()     
        self.device = 'cuda' if torch.cuda.is_available() else 'cpu'
        self.encoder = encoder.to(self.device)
        self.decoder = decoder.to(self.device)
        self.tok_dict, self.tokens, self.max_len = makeDict()

    def forward(self, input):
        img_vec = self.encoder(input).squeeze().to(self.device)


        sos = torch.tensor(self.tok_dict['<sos>']).to(self.device)
        prim_vec = self.decoder.embedding(sos).to(self.device)
        print("img_vec : ")
        print(img_vec.shape)

        print("prim_vec : ")
        print(prim_vec.shape)
        img_vec = img_vec.unsqueeze(0)
        prim_vec = prim_vec.unsqueeze(0)
        input = torch.cat([img_vec, prim_vec], dim=1).to(self.device)
        print("input : ")
        print(input.shape)
        hidden = None

        outputs = []

        for i in range(self.max_len):
            output, hidden = self.decoder(input, hidden)
            prev_token = torch.argmax(output, dim=1)
            print(prev_token)
            if prev_token.item() == self.tok_dict["<eos>"]:
                break
            
            print(prev_token.item())
            outputs.append(self.tokens[prev_token.item()])
            prev_vec = self.decoder.embedding(prev_token)
            input = torch.cat([img_vec, prev_vec], dim=1).to(self.device)

        return outputs

if __name__ == "__main__" :
    model = LATEXX()
    print(len(model.tok_dict))
    print(len(model.tokens))
    print(model.max_len)
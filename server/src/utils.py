import torch
from torchvision import transforms
from PIL import Image

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"Using device: {device}")


def trf_img(img_path, img_size = (224,224)):
    img = transforms.ToTensor()(Image.open(img_path).convert('RGB'))

    if img.shape[0] == 1:
        img = img.repeat(3, 1, 1)
        
    transform = transforms.Compose([transforms.Resize(img_size), transforms.Normalize(mean=[0.5, 0.5, 0.5], std=[0.5, 0.5, 0.5])])

    return transform(img).detach()


def splitLabel(label, mode = 'train') :
    idx = gt = ""
    i = 0,
    st = 6 if mode == 'train' else 4
    for i in range(st, len(label)) :
        if label[i] == '.' :
            break
        idx+=label[i]

    gt = label[i+4:-1]
    return int(idx), gt

def remove_pads(labels):
   non_pad_cols = (labels != 245).sum(dim=0).to(device)
   non_pad_cols = non_pad_cols[non_pad_cols > 0].to(device)

   return labels[:, :len(non_pad_cols)].to(device)


def makeDict(label_path = "./src/train_val_labels.txt") :
    tok_dict = dict()
    tokens = []
    add_tokens = ["<sos>", "<eos>", "<pad>"]
    max_len = 0
    with open(label_path, 'r', encoding='utf8') as f :
        for line in f.readlines() :
            _, label = splitLabel(line)
        
            max_len = max(max_len, len(label.split())+2)
            for token in label.split() :
                if token not in tokens :
                    tokens.append(token)
                    tok_dict[token] = len(tok_dict)
        
        for token in add_tokens :
            tokens.append(token)
            tok_dict[token] = len(tok_dict)

    return tok_dict, tokens, max_len

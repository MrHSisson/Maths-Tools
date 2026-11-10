from pathlib import Path
import json, math, re, textwrap
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from PIL import Image

import argparse
parser=argparse.ArgumentParser();parser.add_argument('--work',type=Path,required=True);args=parser.parse_args()
ROOT=args.work; OUT=ROOT/'lesson-output'; ASSETS=ROOT/'lesson-assets'; OUT.mkdir(exist_ok=True)
B=json.loads((ROOT/'lesson-bundle.json').read_text()); A={a['id']:a for a in B['assets']}; G=B['groups']
NAVY='1E3A8A'; INK='0F172A'; MUTED='64748B'; TEAL='0F766E'; PURPLE='7C3AED'; LINE='CBD5E1'

def num(n): return str(int(n)) if float(n).is_integer() else f'{n:g}'
def area(poly): return abs(sum(p[0]*poly[(i+1)%len(poly)][1]-poly[(i+1)%len(poly)][0]*p[1] for i,p in enumerate(poly)))/2

def clean(s):
 s=s.replace('\\times','×').replace('\\,',' ').replace('\\;',' ').replace('\\mathrm{cm}','cm').replace('\\left','').replace('\\right','')
 return re.sub(r'\s+',' ',s.replace(',\\', '; ')).strip()

def calculations(a):
 rows=[]
 for w in a['working']:
  if w.get('label','').startswith('Find the internal'): rows.append(w['label'].replace('Find the ','')+' '+clean(w['latex'])+' cm')
 d=a['drawing']; splits=[r for r in d['regions'] if r['id'].startswith('s')]; cuts=[r for r in d['regions'] if r['id'].startswith('c')]
 def dims(r):
  xs=[p[0] for p in r['pts']];ys=[p[1] for p in r['pts']];return max(xs)-min(xs),max(ys)-min(ys)
 if splits:
  vals=[]
  for i,r in enumerate(splits):
   w,h=dims(r);v=w*h;vals.append(v);rows.append(f'{chr(65+i)}: {num(w)} × {num(h)} = {num(v)} cm²')
  rows.append('Area: '+' + '.join(num(v) for v in vals)+' = '+a['answer']+' cm²')
 elif cuts:
  w,h=dims(next(r for r in d['regions'] if r['id']=='outer'));rows.append(f'Whole: {num(w)} × {num(h)} = {num(w*h)} cm²')
  vals=[]
  for i,r in enumerate(cuts):
   cw,ch=dims(r);vals.append(cw*ch);rows.append(f'Cut-out {i+1}: {num(cw)} × {num(ch)} = {num(cw*ch)} cm²')
  rows.append('Area: '+num(w*h)+' − '+' − '.join(num(v) for v in vals)+' = '+a['answer']+' cm²')
 return rows

def unknowns(a): return [e.get('value','') for e in a['drawing']['edges'] if e['kind']=='missing']

# Independent verification from the drawn polygons, rectangle regions and edge vectors.
verified=[]
for a in A.values():
 d=a['drawing']; actual=area(d['polys'][0])-sum(area(p) for p in d['polys'][1:]); assert actual==float(a['answer']),(a['id'],actual,a['answer'])
 splits=[r for r in d['regions'] if r['id'].startswith('s')]
 if splits: assert sum(area(r['pts']) for r in splits)==actual
 else:
  outer=next(r for r in d['regions'] if r['id']=='outer'); assert area(outer['pts'])-sum(area(r['pts']) for r in d['regions'] if r['id'].startswith('c'))==actual
 for e in d['edges']:
  if e['kind']=='missing':
   val=math.hypot(e['b'][0]-e['a'][0],e['b'][1]-e['a'][1]); assert val==float(e['value'].split()[0]); assert all(f['label']!=e['value'] for f in d['edges'] if f['kind']=='plain')
 boxw=max(p[0] for p in d['polys'][0])-min(p[0] for p in d['polys'][0]);boxh=max(p[1] for p in d['polys'][0])-min(p[1] for p in d['polys'][0]);assert boxw*boxh!=actual
 verified.append({'id':a['id'],'area':actual,'missing':unknowns(a),'wrong_enclosing_rectangle':boxw*boxh,'method':calculations(a)})
for group in ['practiceOne','practiceTwo','worksheet']:
 vals=[A[k]['answer'] for k in G[group]];assert len(vals)==len(set(vals)),(group,vals)
assert all(A[k]['item']['rectilinear']['reducedLabels'] for k in G['worksheet'])
(ROOT/'lesson-verification.json').write_text(json.dumps(verified,indent=2))

# Readable A4 worksheets: four questions on each page, fading support by section.
fontbase='/usr/share/fonts/truetype/dejavu/';pdfmetrics.registerFont(TTFont('DV',fontbase+'DejaVuSans.ttf'));pdfmetrics.registerFont(TTFont('DVB',fontbase+'DejaVuSans-Bold.ttf'))
W,H=A4

def pdftext(c,x,y,s,size=10,bold=False,color=INK):c.setFillColorRGB(*[int(color[i:i+2],16)/255 for i in (0,2,4)]);c.setFont('DVB' if bold else 'DV',size);c.drawString(x,y,s)

def lines(c,x,y,s,width=240,size=10,leading=15,bold=False):
 words=s.split();line='';out=[]
 for word in words:
  trial=(line+' '+word).strip()
  if pdfmetrics.stringWidth(trial,'DVB' if bold else 'DV',size)>width and line:out.append(line);line=word
  else:line=trial
 if line:out.append(line)
 for line in out:pdftext(c,x,y,line,size,bold);y-=leading
 return y

def worksheet(path,answers=False):
 c=canvas.Canvas(str(path),pagesize=A4);c.setTitle('Rectilinear area — '+('worked answers' if answers else 'worksheet'));c.setAuthor('Maths')
 labels=['A · Draw partitions only','B · Internal lengths, then area','C · L, M and O cut-outs']
 instructions=['Draw lines to make rectangles. Do not calculate areas yet.','Calculate internal rectangle dimensions before their areas.','Use the whole rectangle minus every removed area.']
 for page in range(3):
  pdftext(c,30,H-34,'Area of rectilinear shapes',18,True,NAVY);pdftext(c,30,H-53,'Worked answers' if answers else 'Name: __________________________   Class: __________',10)
  pdftext(c,30,H-78,labels[page],12,True,TEAL);pdftext(c,30,H-96,instructions[page],9)
  gap=14;cw=(W-60-gap)/2;ch=337;top=H-112
  for j,k in enumerate(G['worksheet'][page*4:page*4+4]):
   idx=page*4+j+1;a=A[k];x=30+(j%2)*(cw+gap);yt=top-(j//2)*(ch+12);bottom=yt-ch
   c.setStrokeColorRGB(.80,.84,.88);c.setLineWidth(.6);c.roundRect(x,bottom,cw,ch,5,stroke=1,fill=0)
   pdftext(c,x+9,yt-17,str(idx)+'.',11,True)
   # The same small-mode SVG supplies both print diagrams; images remain crisp at over 300 dpi.
   variant='paperAnswer' if answers else 'paper';c.drawImage(str(ASSETS/f'{k}-{variant}.png'),x+8,yt-(190 if answers and page==1 else 218),width=cw-16,height=170 if answers and page==1 else 198,preserveAspectRatio=True,anchor='c',mask='auto')
   y=yt-204 if answers and page==1 else yt-232
   if answers and page==0:
    y=lines(c,x+10,y,'One valid partition is shown. Accept other rectangle partitions with no gaps or overlaps.',cw-20,10,15)
   elif answers:
    for row in calculations(a):y=lines(c,x+10,y,row,cw-20,9.6,14,bold=row.startswith('Area:'))-3
   else:
    spec=a['item']['rectilinear']
    if page==0:
     lines(c,x+10,y,'Draw a valid partition into rectangles.',cw-20,10,15)
     continue
    if page==1:
     pdftext(c,x+10,y,'Internal length(s): __________ cm',10);y-=22
    if spec.get('missingLength'):pdftext(c,x+10,y,'Missing length: __________ cm',10);y-=22
    if spec['scaffold']=='full':
     for r in [r for r in a['drawing']['regions'] if r['id'].startswith('s')]:
      pdftext(c,x+10,y,f'Rectangle {r["text"]}: ___ × ___ = ___ cm²',10);y-=23
     pdftext(c,x+10,y,'Total area: ______________ cm²',10)
    else:
     pdftext(c,x+10,y,'Show your method:',10);y-=16
     for z in range(2 if spec.get('missingLength') else 3):c.setStrokeColorRGB(.85,.87,.90);c.line(x+10,y,x+cw-10,y);y-=18
     pdftext(c,x+10,y,'Area: __________________ cm²',10)
   assert y>bottom+5,(k,'working runs off cell',y,bottom)
  pdftext(c,30,18,'All lengths in cm. Use the labels, not the apparent size of the drawing.',8,MUTED if False else False) if False else None
  pdftext(c,30,18,'Different valid partitions are possible.' if page==0 else 'All lengths in cm · Give areas in cm²',8,color=MUTED);pdftext(c,W-88,18,f'Page {page+1} / 3',8,color=MUTED);c.showPage()
 c.save()
worksheet(OUT/'Rectilinear_Area_Worksheet.pdf');worksheet(OUT/'Rectilinear_Area_Worked_Answers.pdf',True)


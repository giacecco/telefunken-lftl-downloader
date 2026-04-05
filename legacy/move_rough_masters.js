const { execSync, execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const BASE = "/Volumes/home/music/multitracks/Telefunken Elektroakustik";
const YT = `${BASE}/YouTube`;

function setGreen(folderPath) {
  try {
    const script = `tell application "Finder"\n\tset label index of (item (POSIX file "${folderPath.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}")) to 6\nend tell`;
    execFileSync('osascript', ['-e', script]);
  } catch(e) {
    console.log(`  (warning: could not set green label: ${e.stderr ? e.stderr.toString().split('\n')[0] : e.message})`);
  }
}

function moveFile(srcName, dstFolder) {
  const src = path.join(YT, srcName);
  const dstDir = path.join(BASE, dstFolder);
  const dst = path.join(dstDir, "rough master.m4a");
  if (!fs.existsSync(src)) {
    if (fs.existsSync(dst)) {
      // Already moved in a previous run — just ensure green label
      setGreen(dstDir);
      console.log(`  ALREADY MOVED (label set): ${dstFolder}`);
    } else {
      console.log(`  SOURCE NOT FOUND: ${srcName}`);
    }
    return;
  }
  if (!fs.existsSync(dstDir) || !fs.statSync(dstDir).isDirectory()) {
    console.log(`  DEST NOT FOUND: ${dstFolder}`);
    return;
  }
  fs.renameSync(src, dst);
  setGreen(dstDir);
  console.log(`  OK: ${dstFolder}`);
}

const pairs = [
  ["Megan Slankard & Alex Wong - \uff02Show Yourself\uff02 (TELEFUNKEN Live From The Lab) [--i4hPp8YE4].m4a", "Alex Wong - Show Yourself"],
  ["Megan Slankard & Alex Wong - \uff02There Are No Shadows In L.A.\uff02 (TELEFUNKEN Live From The Lab) [vpuKdYP_NqQ].m4a", "Alex Wong_There are no Shadows in L.A"],
  ["Arms & Voices - \uff02Always Had You\uff02 (TELEFUNKEN Live From The Lab) [M89xxL-pL7E].m4a", "Arms and Voices - Always Had You"],
  ["Balkun Brothers - \uff02So Hi. So Lo.\uff02 (TELEFUNKEN Live From The Lab) [YRZmXKhUzSk].m4a", "Balkun Brothers - So Hi So Low"],
  ["Bella's Bartok - \uff02Ode to Bregovic\uff02 (TELEFUNKEN - Live From the Lab) [ypq2j7clREk].m4a", "Bella's Bartok - Ode To Bregovic"],
  ["Belle Of The Fall - \uff02Don't Give Up On Me\uff02 (TELEFUNKEN Live From The Lab) [rV4BuHZJvpw].m4a", "Belle of the Fall - Dont Give Up On Me"],
  ["Bernard Purdie & Friends with Alan Friedman - \uff02It's Your Thing\uff02 TELEFUNKEN Live From The Lab [wxFNh25mVYg].m4a", "Bernard Purdie - It's Your Thing"],
  ["Cabin Fever - \uff02One More\uff02 (TELEFUNKEN Live From the Lab) [k7aeOCzE2xg].m4a", "Cabin Fever - One More"],
  ["Candlebox - \uff02Happy Pills\uff02 (TELEFUNKEN Live From The Lab) [vrneH8qctSA].m4a", "Candlebox - Happy Pills"],
  ["Candlebox - \uff02Sometimes\uff02 (TELEFUNKEN Live From The Lab) [vRQCFYxvGmQ].m4a", "Candlebox - Sometimes"],
  ["Candlebox - \uff02Surrendering\uff02 (TELEFUNKEN Live From The Lab) [n2vXRzljE5A].m4a", "Candlebox - Surrendering"],
  ["Candlebox - \uff02Sweet Summer Time\uff02 (TELEFUNKEN Live From The Lab) [K1LA8CS28Ik].m4a", "Candlebox - Sweet Summer Time"],
  ["Candlebox - \uff02Vexatious\uff02 (TELEFUNKEN Live From The Lab) [hWW6TkXv5L8].m4a", "Candlebox - Vexatious"],
  ["Canyon - \uff02Slow\uff02 (TELEFUNKEN Live From The Lab) [Y459uXjc1tQ].m4a", "Canyon - Slow"],
  ["Chad Hollister Band - \uff02Eyes\uff02 (TELEFUNKEN Live From The Lab) [L2OjctK3LOs].m4a", "Chad Hollister Band - Eyes"],
  ["Colbis the Creature - \uff02Bad Juju\uff02 (TELEFUNKEN Live From the Lab) [Cp2xeyV6DoA].m4a", "Colbis the Creature - Bad JuJu"],
  ["Colebrook Road - \uff02Bright Angel\uff02 (TELEFUNKEN Live From The Lab) [ebcuKSxtylc].m4a", "Colebrook Road - Bright Angle"],
  ["Crazy Swedes - \u201cBig Trouble\u201d TELEFUNKEN Live from the Lab [r-MLzMujx5I].m4a", "Crazy Swedes - Big Trouble"],
  ["Crazy Swedes - \uff02Flight #4\uff02 TELEFUNKEN Live from the Lab [mrh0_wkh870].m4a", "Crazy Swedes - Flight #4"],
  ["Crazy Swedes - \uff02Southern Fried\uff02 TELEFUNKEN Live from the Lab [q1VE23nidUM].m4a", "Crazy Swedes - Southern Fried"],
  ["Cricket Blue - \uff02Quiet Part II\uff02 (TELEFUNKEN Live from the Lab) [sDIjm7gM-aA].m4a", "Cricket Blue - Quiet Part 2"],
  ["Cyro Baptista & Glasso Lalia - \uff02Maracatubs\uff02 (LIVE FROM THE LAB) [AJ6LkLFO-VE].m4a", "Cyro Baptista and Glasso Lalia - Maracatubs"],
  ["Cyro Baptista & Glasso Lalia - \uff02Obama\uff02 (LIVE FROM THE LAB) [_e2F432vSJE].m4a", "Cyro Baptista and Glasso Lalia - Obama"],
  ["Cyro Baptista & Glasso Lalia - \uff02Parar de Fumar\uff02 (LIVE FROM THE LAB) [j_o4RuVmHxs].m4a", "Cyro Baptista and Glasso Lalia - Parar de Fumar"],
  ["Deadgrass - \uff02Uncle John's Band\uff02 (Grateful Dead Cover) (TELEFUNKEN Live From The Lab) [CxN4LS05b-U].m4a", "Deadgrass - Uncle John's Band"],
  ["Deadgrass - \uff02Walls\uff02 (Tom Petty Cover) (TELEFUNKEN Live From The Lab) [5wBo7roaZkU].m4a", "Deadgrass - Walls"],
  ["Deadgrass - \uff02Mission In the Rain\uff02 (Jerry Garcia Cover) (TELEFUNKEN Live From The Lab) [e_0mlBa6j0A].m4a", "Mission in the rain - Deadgrass"],
  ["Dom McLennon - \uff02First Offering\uff02 TELEFUNKEN Live From The Lab [yMR8zj-VBxw].m4a", "Dom McLennon - First Offering"],
  ["Dom McLennon - \uff02Gym Hours\uff02 TELEFUNKEN Live From The Lab [neRYxfY8myc].m4a", "Dom McLennon - Gym Hours"],
  ["Dom McLennon - \uff02Russian Cream\uff02 TELEFUNKEN Live From The Lab [kfIbS5mqKt8].m4a", "Dom McLennon - Russian Cream"],
  ["Dom McLennon - \uff02Sculptor's Request\uff02 TELEFUNKEN Live From The Lab [PGEhbe4r15w].m4a", "Dom McLennon - Sculptors Request"],
  ["Doom Flamingo - \uff02Blind Spots\uff02 TELEFUNKEN Live From The Lab [lt7uu8B4BGQ].m4a", "Doom Flamingo - Blind Spots"],
  ["Doom Flamingo - \uff02Long Way Home\uff02 TELEFUNKEN Live From The Lab [SbqlkLL00oQ].m4a", "Doom Flamingo - Long Way Home"],
  ["Doom Flamingo - \uff02Measurements\uff02 TELEFUNKEN Live From The Lab [rqR-IX9QH70].m4a", "Doom Flamingo - Measurements"],
  ["Doom Flamingo - \uff02Strangest Places\uff02 TELEFUNKEN Live From The Lab [CbjHAPgBDUs].m4a", "Doom Flamingo - Strangest Places"],
  ["Eggy - \uff02Bloomlight\uff02 TELEFUNKEN Live from the Lab [bXIvUeDuzac].m4a", "Eggy - Bloomlight"],
  ["Eggy - \uff02Farthest Step\uff02 TELEFUNKEN Live from the Lab [qMTae0Ety_g].m4a", "Eggy - Farthest Step"],
  ["Eggy - \uff02Fragments\uff02 TELEFUNKEN Live from the Lab [4iqbyfbCoXo].m4a", "Eggy - Fragments"],
  ["Escaper - \uff02Galaxy\uff02 (TELEFUNKEN Live From the Lab) [FPCiuCoHa54].m4a", "Escaper - Galaxy"],
  ["Evening Darling - \uff02Passenger Side\uff02 (TELEFUNKEN Live From The Lab) [EA8c4MvdB84].m4a", "Evening Darling - Passenger Side"],
  ["FriendZWorldMusic - \uff02Dja\uff02 - TELEFUNKEN Live From The Lab [5FFF5IbynuA].m4a", "Friendz World Music -  Dja"],
  ["FriendZWorldMusic - \uff02Triba\u29f8Bao Kuku\uff02 - TELEFUNKEN Live From The Lab [0VOR35ybWIs].m4a", "Friendz World Music -  Triba Bao Kuku"],
  ["FriendZWorldMusic - \uff02Mamaya\u29f8Lamba\u29f8Guinea Fare\u29f8Mane\uff02 - TELEFUNKEN Live From The Lab [8CF1CJqhjHg].m4a", "Friendz World Music - Mamaya Lamba Guinea Fare Mane"],
  ["Fruition - \uff02Santa Fe\uff02 (TELEFUNKEN Live From The Lab) [4pc2zTVRF-4].m4a", "Fruition - Sante Fe"],
  ["Funky Dawgz Brass Band - \uff02Live Ya Life\uff02 (TELEFUNKEN Live From the Lab) [70rfMf57Cso].m4a", "Funky Dawgz Brass Band - Live Ya Life"],
  ["Funky Dawgz Brass Band - \uff02Place 2 Be\uff02 (TELEFUNKEN Live From The Lab) [RqGmJkga4Ac].m4a", "Funky Dawgz Brass Band - Place 2 Be"],
  ["Gang Of Thieves - \uff02War Pigs\uff02 (Black Sabbath Cover) (TELEFUNKEN Live From The Lab) [UcI2s2V9gpw].m4a", "Gang Of Thieves - War Pigs"],
  ["Ghost-Note - \uff02Ja-make-ya Dance\uff02 (TELEFUNKEN Live From The Lab) [w4d1Di8ti8g].m4a", "GhostNote - Ja-Maka-Ya-Dance"],
  ["Goodnight Blue Moon - \uff02Rabbit Hole\uff02 (TELEFUNKEN Live from the Lab) [aGLdQK5o6kY].m4a", "Goodnight Blue Moon - Rabbit Hole"],
  ["Gracie and Rachel - \uff02Tiptoe\uff02 (TELEFUNKEN Live From The Lab) [O__8ZNz1kng].m4a", "Gracie and Rachel - Tip Toe"],
  ["Hayley Jane - \uff02Colorado\uff02 (TELEFUNKEN Live From The Lab) [DDKvFFBQCwM].m4a", "Hayley Jane - Colorado"],
  ["Hayley Jane - \uff02If Looks Could Kill\uff02 (TELEFUNKEN Live From The Lab) [6rKc5UOVfr8].m4a", "Hayley Jane - If Looks Could Kill"],
  ["Hayley Jane - \uff02Oh My Omar\uff02 (TELEFUNKEN Live From The Lab) [G56Kt4FLIFk].m4a", "Hayley Jane - Oh My O Mar"],
  ["Hayley Jane - \uff02Stay Asleep\uff02 (TELEFUNKEN Live From The Lab) [F6B03QTlG8o].m4a", "Hayley Jane - Stay Asleep"],
  ["Hayley Reardon & Pau Figueres - \uff02After You\uff02 - TELEFUNKEN Live From The Lab [cQBlax2mWoQ].m4a", "Hayley Reardon and Pau Figueres - After You"],
  ["Hayley Reardon & Pau Figueres - \uff02Alive\uff02 TELEFUNKEN Live From The Lab [ZXozexA4RcA].m4a", "Hayley Reardon and Pau Figueres - Alive"],
  ["Hayley Reardon & Pau Figueres - \uff02In The Good Light\uff02 TELEFUNKEN Live From The Lab [ps2FjuLn2kM].m4a", "Hayley Reardon and Pau Figueres - In The Good Light"],
  ["Hayley Reardon & Pau Figueres - \uff02Somethings Gonna Hurt\uff02 TELEFUNKEN Live From The Lab [AE3ZjX68jCw].m4a", "Hayley Reardon and Pau Figueres - Somethings Gonna Hurt"],
  ["Hurray For the Riff Raff - \uff02Living In The City\uff02 (TELEFUNKEN Live From the Lab) [wQaAPbbD268].m4a", "Hurray for the Riff Raff - Livin in the City"],
  ["Ian Ethan Case - \uff02A New Day\uff02 (TELEFUNKEN Live From The Lab) [VaszrEmfEBE].m4a", "Ian Ethan Case - A New Day"],
  ["Ikebe Shakedown - \uff02The Last Stand\uff02 (TELEFUNKEN Live From The Lab) [jGCYriDvjGQ].m4a", "Ikebe Shakedown - The Last Stand"],
  ["Jamie Kent - \uff02All American Mutt\uff02 (TELEFUNKEN Live From The Lab) [GCGZvokRTRY].m4a", "Jamie Kent - All American Mutt"],
  ["Jeff Campbell (with Megan Slankard) - \uff02Noones Keeping Score\uff02 (TELEFUNKEN Live From The Lab) [WLXLFon5hgQ].m4a", "Jeff Cambell & Megan Slankard - No One's Keeping Score"],
  ["Jeffrey John Band - \uff02Anybody Out There\uff02 TELEFUNKEN Live From The Lab [VfZZbNtjP9E].m4a", "Jeffery John Band - Anybody Out There"],
  ["Jeffrey John Band - \uff02Chase the Blues Away\uff02 TELEFUNKEN Live From The Lab [LrYOG8N_oTI].m4a", "Jeffery John Band - Chase The Blues Away"],
  ["Jeffrey John Band - \uff02Devil of Doubt\uff02 TELEFUNKEN Live From The Lab [5c2GlzTxnCM].m4a", "Jeffery John Band - Devil of Doubt"],
  ["Jeffrey John Band - \uff02Pull Yourself Together\uff02 TELEFUNKEN Live From The Lab [OrWgb4oVa6o].m4a", "Jeffery John Band - Pull Yourself Together"],
  ["Jelly - \uff02Dance of the Sugar Plum Fairy \u29f8 Carol of the Bells\uff02 TELEFUNKEN Live From The Lab [Xy97A4NOUeQ].m4a", "Jelly - XMAS jams"],
  ["John Doe - \uff02Sunlight\uff02 (TELEFUNKEN Live From The Lab) [BlxBNZNE9SQ].m4a", "John Doe - Sunlight"],
  ["John Doe - \uff02The Golden State\uff02 (TELEFUNKEN Live From The Lab) [gB3TSmyzpCI].m4a", "Jon Doe - Golden State"],
  ["Jon McLaughlin - \uff02I Want You Anyway\uff02 (TELEFUNKEN Live From The Lab) [mjYlvLFROZE].m4a", "John McLaughlin - I Want You Anyway"],
  ["John Morgan Kimock \u2013 Hikikomori, Love Does (TELEFUNKEN Live From The Lab) [OVi0h9Km3oU].m4a", "John Morgan Kimock - Hikikomori - Love Does"],
  ["John Morgan Kimock \u2013 Negative Space, Speed (TELEFUNKEN Live From The Lab) [VrtsIbLoOxU].m4a", "John Morgan Kimock - Negative Space - Speed"],
  ["John Morgan Kimock \u2013 New One (TELEFUNKEN Live From The Lab) [xJ4k34d-h5Q].m4a", "John Morgan Kimock - New One"],
  ["John Morgan Kimock \u2013 Procession (TELEFUNKEN Live From The Lab) [ndBSpGkUV4E].m4a", "John Morgan Kimock - Procession"],
  ["Jon McLaughlin - \uff02More Than Me\uff02 (TELEFUNKEN Live From The Lab) [ER5yRx64BN4].m4a", "Jon McLaughlin - More Than Me"],
  ["Jon McLaughlin - \uff02Thank God\uff02 (TELEFUNKEN Live From The Lab) [xNPxJkq3dyc].m4a", "Jon McLaughlin - Thank God"],
  ["Jonathan Barber & Vision Ahead -  \uff02Mr. JB\uff02 (TELEFUNKEN Live From the Lab) [kNwdPCPWc4Q].m4a", "Jonathan Barber - Mr.JB"],
  ["Enter The Haggis (as Jubilee Riots) - \uff02Two Bare Hands\uff02 (TELEFUNKEN Live From The Lab) [HKY-oE74Mhs].m4a", "Jubilee Riots - 2 Bar Hands"],
  ["Juicy Grapes - \uff02Infinity\uff02 (TELEFUNKEN Live from the Lab) [5schsZCULYA].m4a", "The Juicy Grapes - Infinity"],
  ["Karmic Juggernaut - \uff02Frunobulax\uff02 (TELEFUNKEN Live From the Lab) [X7EY-nY5hew].m4a", "Karmic Juggernaut - Frunobulax"],
  ["Kate Callahan - \uff02Love Rings Out\uff02 (TELEFUNKEN Live From the Lab) [vsidZCaMQlE].m4a", "Kate Callahan - Love Rings Out"],
  ["Kris Allen Quintet \u2013 \u201cBird Bailey\u201d (LIVE FROM THE LAB) - Litchfield Jazz Fest 2020 [StEYKIkvSD0].m4a", "Kris Allen's Charlie Parker Centennial Celebration - Bird Bailey"],
  ["Kris Allen Quintet \u2013 \u201cBird Lives\u201d (LIVE FROM THE LAB) \u2013 Litchfield Jazz Fest 2020 [kBCVSGZuVqA].m4a", "Kris Allen's Charlie Parker Centennial Celebration - Bird Lives"],
  ["Kris Allen Quintet \u2013 \u201cRepetition\u201d (LIVE FROM THE LAB) \u2013 Litchfield Jazz Fest 2020 [os-R7mAKdx0].m4a", "Kris Allen's Charlie Parker Centennial Celebration - Repetition"],
  ["Kung Fu - \uff02Daddy D\uff02 (TELEFUNKEN Live From The Lab) [oSiYsTRGGS4].m4a", "Kung Fu - Daddy D"],
  ["Kung Fu - \uff02Joyride\uff02 (TELEFUNKEN Live From The Lab) [ErBEMPCLBSY].m4a", "Kung Fu - Joy ride"],
  ["Lawsuits - \uff02Wild Heart\uff02 (TELEFUNKEN Live From the Lab) [d4g5i01OO1g].m4a", "Lawsuits - Wild Heart"],
  ["Leslie Mendelson - \uff02Coney Island\uff02 (TELEFUNKEN Live From The Lab) [6EdRz8hnY-A].m4a", "Leslie Mendelson - Coney Island"],
  ["Leslie Mendelson - \uff02Don't Get Me Wrong\uff02 (TELEFUNKEN Live From The Lab) [N2zxdzdB-DY].m4a", "Leslie Mendelson - Don't get me wrong"],
  ["Leslie Mendelson - \uff02Love You Tonight\uff02 (TELEFUNKEN Live From The Lab) [ojd5i1ZzMwg].m4a", "Leslie Mendelson - Love you tonight"],
  ["Leslie Mendelson - \uff02The Hardest Part\uff02 (TELEFUNKEN Live From The Lab) [LJHwWgsoSrQ].m4a", "Leslie Mendelson - The Hardest Part 2"],
  ["Matthew Szlachetka - \uff02Wasting Time\uff02 (TELEFUNKEN Live From The Lab) [WtYEXGQ2eJg].m4a", "Matt Szlachetka - Wasting Time"],
  ["Matter - \uff02My Soul\uff02 (TELEFUNKEN Live From The Lab) [ppNSvwatRaU].m4a", "Matter - My Soul"],
  ["Matthew Szlachetka - \uff02Heart Of My Hometown\uff02 (TELEFUNKEN Live From The Lab) [HECKaRUIbSs].m4a", "Matthew Szlachetka - Heart of my home town"],
  ["McLovins - \uff02Buildin' It Up\uff02 (TELEFUNKEN Live From The Lab) [5aIw8a0yMe0].m4a", "McLovins - Buildin it up"],
  ["McLovins - \uff02Either Way\uff02 (Wilco Cover) (TELEFUNKEN Live From The Lab) [87UEFpZp2S4].m4a", "McLovins - Either Way"],
  ["Megan Slankard & Alex Wong - \uff02High Note\uff02 (TELEFUNKEN Live From The Lab) [85yfgLv2kIw].m4a", "Megan Slankard - High note"],
  ["Megan Slankard & Alex Wong - \uff02You Got This\uff02 (TELEFUNKEN Live From The Lab) [jr0E5-KbtrQ].m4a", "Megan Slankard - You got this"],
  ["Mikaela Davis and Southern Star - \uff02Cinderella\uff02 (TELEFUNKEN Live From The Lab) [BxytBIUfV1A].m4a", "Mikaela Davis - Cinderella"],
  ["Mikaela Davis and Southern Star - \uff02Dont Stop Now\uff02 (TELEFUNKEN Live From The Lab) [WxGTOBCt1Oc].m4a", "Mikaela Davis - Dont Stop Now"],
  ["Mikaela Davis and Southern Star - \uff02Home In The Country\uff02 (TELEFUNKEN Live From The Lab) [NgrQlNaKMfo].m4a", "Mikaela Davis - Home In The Country"],
  ["Mikaela Davis and Southern Star - \uff02Promise\uff02 (TELEFUNKEN Live From The Lab) [ITIABAuTZRU].m4a", "Mikaela Davis - Promise"],
  ["Mipso  - \uff02Caroline\uff02 TELEFUNKEN Live From The Lab [Mr0WZecqWeo].m4a", "Mipso - Caroline"],
  ["Mipso  - \uff02People Change\uff02 TELEFUNKEN Live From The Lab [0X1V8zN1dlU].m4a", "Mipso - People Change"],
  ["Mipso  - \uff02Wallpaper Baby\uff02 TELEFUNKEN Live From The Lab [7tiTVOybrEA].m4a", "Mipso - Wallpaper Baby"],
  ["Mipso  - \uff02Your Body\uff02 TELEFUNKEN Live From The Lab [q7U98Jc-uAs].m4a", "Mipso - Your Body"],
  ["Moe - \uff02In Memory of Elizabeth Reed\uff02 (Allman Brothers Band Cover) [jsT9iFz2S8k].m4a", "MOE - In Memory of Elizabeth Reed"],
  ["moe. - \uff02Prestige Worldwide\uff02 (TELEFUNKEN Live From the Lab) [9pZuvctfrkU].m4a", "MOE - Prestige Worldwide"],
  ["Moorea Masa & The Mood with Swatkins - \uff02Honey\uff02 TELEFUNKEN Live from the Lab [5KwS5GmqiHo].m4a", "Moorea Masa and Swatkins - Honey"],
  ["Moorea Masa & The Mood with Swatkins - \uff02Lost and Alive\uff02 TELEFUNKEN Live from the Lab [GityXqPggao].m4a", "Moorea Masa and Swatkins - Lost & Alive"],
  ["Swatkins with Moorea Masa - \uff02Until I Get Back\uff02 TELEFUNKEN Live from the Lab [wvWG6EdCyuM].m4a", "Moorea Masa and Swatkins - Until I Get Back"],
  ["Natalie Cressman & Mike Bono - \uff02I Look To You\uff02 (TELEFUNKEN Live From The Lab) [vfy1u_7m0vY].m4a", "Natalie Cressman & Mike Bono - I Look To You"],
  ["Nicole Zuraitis \u2013 \u201cRiver\u201d (Joni Mitchell) (LIVE FROM THE LAB) \u2013 Litchfield Jazz Fest 2020 [0J06AXoCLbs].m4a", "Nicole Zuratis - River"],
  ["Nicole Zuraitis \u2013 \u201cMoon River\u201d (LIVE FROM THE LAB) \u2013 Litchfield Jazz Fest 2020 [2rIlxWqg8oQ].m4a", "Nicole Zuritas - Moon River (LIVE FROM THE LAB)"],
  ["Nicole Zuraitis \u2013 \u201cNight In Tunisia \u29f8 Caravan\u201d (LIVE FROM THE LAB) \u2013 Litchfield Jazz Fest 2020 [Im7hkV3EDLQ].m4a", "Nicole Zuritas - Night In Tunisa : Caravan (LIVE FROM THE LAB)"],
  ["Nik Greeley & The Operators - \uff02Hold On Me\uff02 (TELEFUNKEN Live From the Lab) [a1kyRlNx6BE].m4a", "Nik Greeley and The Operators - Hold On Me"],
  ["Now For Ages - \uff02Bring Me Home\uff02 (TELEFUNKEN Live From The Lab) [0PIXMuvQSfw].m4a", "Now For The Ages - Bring Me Home"],
  ["Oliver Myles Mashburn - \uff02Carrion Crow\uff02 TELEFUNKEN Live from The Lab [CU3SAz_yhqw].m4a", "Oliver Myles Mashburn - Carrion Crow"],
  ["Oliver Myles Mashburn - \uff02Highway Ghost Song\uff02 TELEFUNKEN Live from The Lab [wC3w5i-CzNU].m4a", "Oliver Myles Mashburn - Highway Ghost Song"],
  ["Oliver Myles Mashburn - \uff02Red Moon\uff02 TELEFUNKEN Live from the Lab [LwUpN9RWqdQ].m4a", "Oliver Myles Mashburn - Red Moon"],
  ["Oliver Myles Mashburn - \uff02The Cuckoo\uff02 TELEFUNKEN Live from The Lab [wu44TP002ls].m4a", "Oliver Myles Mashburn - The Cuckoo"],
  ["One Time Weekend - \uff02One Time Weekend\uff02 (TELEFUNKEN Live From the Lab) [LPn6sMLwvXU].m4a", "One TIme Weekend - One Time Weekend"],
  ["Phonosynthesis - \uff02The Promise Man\uff02 (TELEFUNKEN Live From The Lab) [4D0NfG2jaTY].m4a", "Phonosynthesis - Promise Man"],
  ["Plywood Cowboy - \uff02Heartbreak Ready To Fall\uff02 (TELEFUNKEN Live From The Lab) [POuSrqJu2T8].m4a", "Plywood Cowboy - Heartbreak ready to fall"],
  ["Plywood Cowboy - \uff02Last Night's Gig\uff02 (TELEFUNKEN Live From The Lab) [rsyhzLP6eX0].m4a", "Plywood Cowboy - Last Nights Gig"],
  ["Plywood Cowboy  - \uff02Miss Perception\uff02 (TELEFUNKEN Live From The Lab) [tTl7BGemhg8].m4a", "Plywood Cowboy - Misperception"],
  ["Plywood Cowboy - \uff02Silver Mountain\uff02 (TELEFUNKEN Live From The Lab) [f6zy2HeDLHU].m4a", "Plywood Cowboy - Silver Mountain"],
  ["Rebecca Haviland and Whiskey Heart \u2013 \u201c57 Chevy\u201d TELEFUNKEN Live From The Lab [BRoeO_o9PGg].m4a", "Rebecca Haviland - 57 Chevy"],
  ["Rebecca Haviland and Whiskey Heart \u2013 \u201cBourbon\u201d TELEFUNKEN Live From The Lab [60U_Yqht6C8].m4a", "Rebecca Haviland - Burbon"],
  ["Rebecca Haviland and Whiskey Heart \u2013 \u201cCollide With Me\u201d TELEFUNKEN Live From The Lab [n7085clIFSg].m4a", "Rebecca Haviland - Collide With Me"],
  ["Red Tail Hawk - \uff02Cherry Hill\uff02 (TELEFUNKEN Live From the Lab) [CCDOWevS1Ok].m4a", "Red Tailed Hawk - Cherry Hill"],
  ["Ripe - \uff024 On The 10\uff02 (TELEFUNKEN Live From The Lab) [bRxlmRQ1t0Y].m4a", "Ripe - 4 on the 10"],
  ["Robert Delong - \uff02Long Way Down\uff02 (TELEFUNKEN Live From The Lab) [pd297QzQ6AI].m4a", "Robert Delong - Long Way Down"],
  ["Rubblebucket - \uff02Carousel Ride\uff02 (TELEFUNKEN Live From The Lab) [nHiBVsFLYpY].m4a", "Rubblebucket - Carousel Ride"],
  ["Rubblebucket - \uff02On The Ground\uff02 (TELEFUNKEN Live From The Lab) [tLKxtoHGdH4].m4a", "Rubblebucket - On the Ground"],
  ["Seselia ~ TELEFUNKEN Podunk Bluegrass Band Competition 08.08.2024 (full set) [fqiPiVrAdTI].m4a", "Seselia - Podunk Bluegrass Competition"],
  ["SixFoxWhiskey - \uff02Hope and the Sea\uff02 (TELEFUNKEN Live From The Lab) [O9IFubyAeVk].m4a", "Six Fox Whiskey - Hope and the Sea"],
  ["SixFoxWhiskey - \uff02Seven Stops\uff02 (TELEFUNKEN Live From The Lab) [ENbFZW508cE].m4a", "Six Fox Whiskey - Seven Stops"],
  ["Static and Surrender - \uff02Mary Shelley\uff02 (TELEFUNKEN - Live From the Lab) [Fr-RASNKAl0].m4a", "Static and Surrender - Mary Shelley"],
  ["Tall Heights - \uff02Spirit Cold\uff02 (TELEFUNKEN Live From The Lab) [EnV33Xo-JeY].m4a", "Tall Heights - Spirit Cold"],
  ["Tauk - \uff02Times Up\uff02 (TELEFUNKEN Live From The Lab) [UbTdiRY_RRI].m4a", "Tauk - Times Up"],
  ["Thana Alexa & Antonio Sanchez Duo - \uff02Improv Bad Hombres y Mujeres\uff02 (LIVE FROM THE LAB) [w3Ck11xqtV8].m4a", "Thana Alexa and Antonio Sanchez Duo - Improv - Bad Hombre Y Mujeres"],
  ["Thana Alexa & Antonio Sanchez Duo - \uff02Ona\uff02 (LIVE FROM THE LAB) [CtxjuFjytkw].m4a", "Thana Alexa and Antonio Sanchez Duo - Ona"],
  ["Thana Alexa & Antonio Sanchez Duo - \uff02Teardrop\uff02 (LIVE FROM THE LAB) [F5-yZNMoodk].m4a", "Thana Alexa and Antonio Sanchez Duo - Teardrop"],
  ["The Ballroom Thieves - \uff02Only Lonely\uff02 (TELEFUNKEN Live From the Lab) [MwG0A7nzGDg].m4a", "The Ballroom Thieves - Only Lonley"],
  ["The Fritz - \uff02Anything Else\uff02 (TELEFUNKEN Live From The Lab) [PgP3eFec2pg].m4a", "The Fritz - Anything Else"],
  ["Girls From Ruby Falls - \uff02Tennessee Wildflowers\uff02 (TELEFUNKEN Live From The Lab) [j0T37CfiB20].m4a", "The Girls From Ruby Falls - Tennesse Wildflowers"],
  ["The Lonely Wild - \uff02Running\uff02 (TELEFUNKEN Live From The Lab) [bbBJ2uFVo6Q].m4a", "The Lonley Wild - Running"],
  ["The Lonely Wild - \uff02Scar\uff02 (TELEFUNKEN Live From The Lab) [rxqD-KV8dfo].m4a", "The Lonley Wild - Scar"],
  ["The Suffers - \uff02Midtown\uff02 (TELEFUNKEN Live From The Lab) [pgJjUq9ZS3s].m4a", "The Suffers - Midtown"],
  ["The Tenderbellies ~ TELEFUNKEN Podunk Bluegrass Band Competition 08.08.2024 (full set) [2KFUVyTs2hE].m4a", "The Tenderbellies - Podunk Bluegrass Band Festival 2025"],
  ["The Western Den - \uff02Artifice\uff02 (TELEFUNKEN Live From The Lab) [V_gV3pLm56Y].m4a", "The Western Den - Artifice"],
  ["The Western Den - \uff02Hem\uff02 (TELEFUNKEN Live From The Lab) [iG9VWBEtP6k].m4a", "The Western Den - Hem"],
  ["The Western Den - \uff02Like You Do\uff02 (TELEFUNKEN Live From The Lab) [lo7Ru039M7c].m4a", "The Western Den - Like You Do"],
  ["The Western Den - \uff02Spark, Set Fire\uff02 (TELEFUNKEN Live From The Lab) [d9BJcY3OINk].m4a", "The Western Den - Spark, Set Fire"],
  ["The Wood Brothers - \uff02Honey Jar\uff02 (TELEFUNKEN Live from the Lab) [UG4hSk9bzz4].m4a", "The Wood Brothers - Honey Jar"],
  ["The Z3 - \uff02Filthy Habits\uff02 (Frank Zappa) (TELEFUNKEN Live From The Lab) [ssstUNfsuZI].m4a", "The Z3 - Filthy Habbits"],
  ["The Z3 - \uff02Teenage Wind\uff02 (Frank Zappa) (TELEFUNKEN Live From The Lab) [jelRUGzDWac].m4a", "The Z3 - Teenage Wind"],
  ["Toad The Wet Sprocket - \uff02Fall Down\uff02 (TELEFUNKEN Live From The Lab) [sy2RcGbzIMI].m4a", "Toad The Wet Sprocket - Fall Down"],
  ["Toad The Wet Sprocket - \uff02Starting Now\uff02 (TELEFUNKEN Live From The Lab) [sERUGUWSAPc].m4a", "Toad The Wet Sprocket - Starting Now"],
  ["Toad The Wet Sprocket - \uff02Transient Whales\uff02 (TELEFUNKEN Live From The Lab) [CzUPs2-ULaw].m4a", "Toad The Wet Sprocket - Transient Whales"],
  ["Tumbling Bones -  \uff02And I Wept\uff02 (TELEFUNKEN Live From The Lab) [r3x0CtkmPE0].m4a", "Tumbling Bones - And I Wept"],
  ["Turkuaz - \uff02Coast to Coast\uff02 (TELEFUNKEN Live From The Lab) [Z9VyJY8aUQA].m4a", "Turkuaz - Coast To Coast"],
  ["Turkuaz - \uff02Lookin' Tough, Feelin' Good\uff02 (TELEFUNKEN Live From The Lab) [a-FFE0QDxF4].m4a", "Turkuaz - Looking Tough"],
  ["Turkuaz - \uff02Tiptoe Through the Crypto\uff02 (TELEFUNKEN Live From The Lab) [xBx1E_EAOKg].m4a", "Turkuaz - Tiptoe Through The Crypto"],
  ["West End Blend - \uff02Baby Be Mine\uff02 (Michael Jackson Cover) (TELEFUNKEN Live From The Lab) [JXIXOJnj36o].m4a", "West End Blend - Baby Be Mine"],
  ["West End Blend - \uff02Kane Guru\uff02 (TELEFUNKEN Live From The Lab) [FFENAchgQCM].m4a", "West End Blend - Kane Guru"],
  ["West End Blend - \uff02Love Having You Around\uff02 (TELEFUNKEN Live From The Lab) [LFKrMThq_bo].m4a", "West End Blend - Love Having You Around"],
  ["West End Blend - \uff02Mama Said Be Good\uff02 (TELEFUNKEN Live From The Lab) [gYywLWk80nI].m4a", "West End Blend - Mama Said Be Good"],
  ["West End Blend - \uff02Must Be Voodoo\uff02 (TELEFUNKEN Live From The Lab) [N2hhYYWyUeg].m4a", "West End Blend - Must be Voodoo"],
  ["Will Evans And Rising Tide - \uff02Me And My Crew\uff02 (TELEFUNKEN Live From the Lab) [owoTzClg514].m4a", "Will Evans - Me and My Crew"],
  ["Wise Old Moon - \uff02Annabelle\uff02 (TELEFUNKEN Live From The Lab) [y4_piFhOiGU].m4a", "Wise Old Moon - Annabelle"],
  ["J.M. Clifford  ~ TELEFUNKEN Podunk Bluegrass Band Competition 08.08.2024 (full set) [99FNJFsGpm0].m4a", "JM Clifford - Podunk Bluegrass Band Festival 2025"],
];

console.log(`Processing ${pairs.length} pairs...\n`);
for (const [srcName, dstFolder] of pairs) {
  moveFile(srcName, dstFolder);
}
console.log("\nDone.");

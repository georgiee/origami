package test;

public class LZW {

    static public void compress(java.io.File input, java.io.File output) throws Exception {

        java.io.FileInputStream fis = new java.io.FileInputStream(input);
        java.io.FileOutputStream fos = new java.io.FileOutputStream(output);
        java.util.HashMap<String, Integer> szotar = new java.util.HashMap<>();
        java.util.ArrayList<Integer> normalatlan = new java.util.ArrayList<>();
        for (int i = 0; i < 256; i++) {
            szotar.put((char) i + "", i);
        }
        String szo = "";
        int b;
        while ((b = fis.read()) != -1) {

            String szo1 = szo + (char) b;
            if (szotar.containsKey(szo1)) {
                szo = szo1;
            } else {

                normalatlan.add(szotar.get(szo));
                szotar.put(szo1, szotar.size());
                szo = (char) b + "";
            }
        }
        fis.close();
        if (!"".equals(szo)) {
            normalatlan.add(szotar.get(szo));
        }
        int magn2 = (int) Math.ceil(Math.log(szotar.size()) / Math.log(2));
        int szakadas = -1;
        for (int i = 0; i < normalatlan.size(); i += 8) {

            String normalt = "";
            for (int ii = i; ii < i + 8; ii++) {

                if (ii < normalatlan.size()) {
                    normalt += BinToString(normalatlan.get(ii), magn2);
                } else {
                    normalt += BinToString(0, magn2);
                    if (szakadas == -1) {
                        szakadas = ii - i;
                    }
                }
            }
            for (int ii = 0; ii < normalt.length(); ii += 8) {
                fos.write(StringToBin(normalt.substring(ii, ii + 8)));
            }
        }
        fos.write(szakadas == -1 ? 0 : szakadas);
        fos.write(magn2);
        fos.close();
    }
    
    static public java.io.ByteArrayInputStream extract(java.io.ByteArrayInputStream input) throws Exception {

        java.io.InputStream fis = input;
        java.util.ArrayList<Byte> fosb = new java.util.ArrayList<>();
        java.util.HashMap<Integer, String> szotar = new java.util.HashMap<>();
        java.util.ArrayList<Integer> normalatlan = new java.util.ArrayList<>();
        for (int i = 0; i < 256; i++) {
            szotar.put(i, (char) i + "");
        }
        int szakadas = 0, magn2 = 0, fajlveg = 0;
        int rb;
        while ((rb = fis.read()) != -1) {

            szakadas = magn2;
            magn2 = rb;
            fajlveg++;
        }
        fis.reset();
        for (int i = 0; i < fajlveg - 1; i += magn2) {
            String normalt = "";
            for (int ii = i; ii < i + magn2; ii++) {
                if (ii - szakadas + magn2 < fajlveg*8 - 8) {
                    normalt += BinToString(fis.read(), 8);
                }
            }
            for (int ii = 0; ii + magn2 <= normalt.length(); ii += magn2) {
                normalatlan.add(StringToBin(normalt.substring(ii, ii + magn2)));
            }
        }
        String szo = (char) (int) normalatlan.remove(0) + "";
        fosb.add((byte)szo.charAt(0));
        for (int b : normalatlan) {

            String szo1;
            if (szotar.containsKey(b)) {
                szo1 = szotar.get(b);
            } else if (b == szotar.size()) {
                szo1 = szo + szo.charAt(0);
            } else {
                break;
            }
            for (int i = 0; i < szo1.length(); i++) {
                fosb.add((byte)szo1.charAt(i));
            }
            szotar.put(szotar.size(), szo + szo1.charAt(0));
            szo = szo1;
        }
        fis.close();
        byte[] fos = new byte[fosb.size()];
        for (int i=0; i<fosb.size(); i++) {
            fos[i] = fosb.get(i);
        }
        return new java.io.ByteArrayInputStream(fos);
    }

    static public String BinToString(int bin, int digits) {

        String s = "";
        for (int i = 0; i < digits; i++) {

            s = Math.abs(bin % 2) + s;
            bin >>>= 1;
        }
        return s;
    }

    static public int StringToBin(String s) {

        int bin = 0;
        for (int i = 0; i < s.length(); i++) {

            bin *= 2;
            bin += Integer.parseInt(s.charAt(i) + "");
        }
        return bin;
    }
}

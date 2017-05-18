import java.util.Arrays;

import test.*;
import java.io.*;

public class OrigamiReader {
    public static void main(String[] args) { 
        String sourceFileName = args[0];
        
        if(sourceFileName.length() == 0){
            System.out.println("Need a source file");
            return;
        }

        String outputFileName = sourceFileName + ".decoded";

        InputStream inputStream = OrigamiReader.class.getClassLoader().getResourceAsStream(sourceFileName);
        java.util.ArrayList<Byte> bytesb = new java.util.ArrayList<>();
        int fisbyte;
        try {
            while ((fisbyte = inputStream.read()) != -1) {
                bytesb.add((byte) fisbyte);
            }
            byte[] bytes = new byte[bytesb.size()];
            for (int i = 0; i < bytesb.size(); i++) {
                bytes[i] = bytesb.get(i);
            }

                
            java.io.InputStream str = LZW.extract(new java.io.ByteArrayInputStream(bytes));
            //System.out.println(getStringFromInputStream(str));

            java.io.InputStream str2 = LZW.extract(new java.io.ByteArrayInputStream(bytes));
            
            OutputStream outputStream = null;
            outputStream = new FileOutputStream(new File(outputFileName));
            ByteArrayOutputStream buffer = new ByteArrayOutputStream();
            int read = 0;
            byte[] bytes2 = new byte[1024];

            while ((read = str.read(bytes2)) != -1) {
                outputStream.write(bytes2, 0, read);
                buffer.write(bytes2, 0, read);
            }

            test(str2);

            if (outputStream != null) {
                try {
                    outputStream.flush();
                    outputStream.close();
                } catch (IOException e) {
                    e.printStackTrace();
                }

            }

        }catch (Exception ex) {
         System.out.println("error");    
        }

        
        System.out.println("Hello, World");
    }
    private static void test(InputStream str) {
        try {
            //reading header
            //reading header
            int fejlec1 = str.read();
            fejlec1 <<= 8;
            fejlec1 += str.read();
            fejlec1 <<= 8;
            fejlec1 += str.read();
            fejlec1 <<= 8;
            fejlec1 += str.read();
            if (fejlec1 == 0x4f453344) { //OE3D
                System.out.println("OK Header" );

                int fejlec2 = str.read(); //version
                fejlec2 <<= 8;
                fejlec2 += str.read(); //number of payloads

                if ((fejlec2 & 0xFF00) == 0x0300) { //ver 3
                    System.out.println("OK v3" );                    
                    //paper type
                    str.read();
                    // 0 if paper type not custm
                    str.read();
                    
                    //paper color -> 0x43 (C) + three values 
                    str.read();
                    str.read();
                    str.read();
                    str.read();

                     //command blocks
                    //command blocks
                    int[] block = new int[16];
                    int i=-1;
                    int index = 0;

                    block[++i] = str.read();
                    block[++i] = str.read();
                    block[++i] = str.read();
                    block[++i] = str.read();
                    int header = (((((block[0] << 8) + block[1]) << 8) + block[2]) << 8) + block[3];
                    while (header != 0x0A454f46) {

                        block[++i] = str.read();
                        block[++i] = str.read();
                        block[++i] = str.read();
                        block[++i] = str.read();

                        block[++i] = str.read();
                        block[++i] = str.read();
                        block[++i] = str.read();
                        block[++i] = str.read();

                        block[++i] = str.read();
                        block[++i] = str.read();
                        block[++i] = str.read();
                        block[++i] = str.read();

                        addCommand(block.clone(), index);
                        index++;
                        i = -1;

                        block[++i] = str.read();
                        block[++i] = str.read();
                        block[++i] = str.read();
                        block[++i] = str.read();
                        header = (((((block[0] << 8) + block[1]) << 8) + block[2]) << 8) + block[3];
                    }


                }


            }
            

        } catch (Exception ex) {
             System.out.println("error");    
            }

            
    }
    
    private static void addCommand(int[] cblock, int index) {
        System.out.println("addCommand " + index);    

        int i = -1;

        int header = cblock[++i];
        header <<= 8;
        header += cblock[++i];
        header <<= 8;
        header += cblock[++i];
        header <<= 8;
        header += cblock[++i];

        short Xint, Yint, Zint;
        int Xfrac, Yfrac, Zfrac;

        Xint = (short) cblock[++i];
        Xint <<= 8;
        Xint += cblock[++i];
        Xfrac = cblock[++i];
        Xfrac <<= 8;
        Xfrac += cblock[++i];
        double X = Xint + Math.signum(Xint) * (double) Xfrac / 256 / 256;


        Yint = (short) cblock[++i];
        System.out.println("Yint" + Yint);
        Yint <<= 8;
        System.out.println("Yint" + Yint);
        Yint += cblock[++i];
        Yfrac = cblock[++i];
        Yfrac <<= 8;
        Yfrac += cblock[++i];
        double Y = Yint + Math.signum(Yint) * (double) Yfrac / 256 / 256;

        Zint = (short) cblock[++i];
        Zint <<= 8;
        Zint += cblock[++i];
        Zfrac = cblock[++i];
        Zfrac <<= 8;
        Zfrac += cblock[++i];
        double Z = Zint + Math.signum(Zint) * (double) Zfrac / 256 / 256;
           

        double[] ppoint = new double[3];
        double[] pnormal = new double[3];
        ppoint[0] = (double) X + Origins[(((header >>> 24) % 32) - ((header >>> 24) % 8)) / 8][0];
        ppoint[1] = (double) Y + Origins[(((header >>> 24) % 32) - ((header >>> 24) % 8)) / 8][1];
        ppoint[2] = (double) Z + Origins[(((header >>> 24) % 32) - ((header >>> 24) % 8)) / 8][2];
        pnormal[0] = X;
        pnormal[1] = Y;
        pnormal[2] = Z;
        System.out.println("ppoint:");
        System.out.println(Arrays.toString(ppoint));    
        System.out.println("pnormal:");
        System.out.println(Arrays.toString(pnormal));    

    }
    final static private double[][] Origins = new double[][] {

            new double[] { 0, 0, 0 }, new double[] { 400, 0, 0 }, new double[] { 0, 400, 0 },
            new double[] { 0, 0, 400 } };
    // convert InputStream to String
    private static String getStringFromInputStream(InputStream is) {

        BufferedReader br = null;
        StringBuilder sb = new StringBuilder();

        String line;
        try {

            br = new BufferedReader(new InputStreamReader(is));
            while ((line = br.readLine()) != null) {
                sb.append(line);
            }

        } catch (IOException e) {
            e.printStackTrace();
        } finally {
            if (br != null) {
                try {
                    br.close();
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
        }

        return sb.toString();

    }

}
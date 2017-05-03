import test.*;
import java.io.*;

public class HelloWorld {
    public static void main(String[] args) { 
        InputStream inputStream = HelloWorld.class.getClassLoader().getResourceAsStream("crane.ori");
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
            
            OutputStream outputStream = null;
            outputStream = new FileOutputStream(new File("crane.ori.plane"));

            int read = 0;
            byte[] bytes2 = new byte[1024];

            while ((read = str.read(bytes2)) != -1) {
                outputStream.write(bytes2, 0, read);
            }
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
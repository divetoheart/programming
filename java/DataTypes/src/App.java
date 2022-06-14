package DataTypes.src;

public class App {
    public static void main(String[] args) {
      
        int num = 10000;

        int min = Integer.MIN_VALUE;    // minimum possible integer -2147483648
        int max = Integer.MAX_VALUE;    // maximum possible integer 2147483647

        // System.out.println("Integer Minimum Value = " + min);
        // System.out.println("Integer Maximum Value = " + max);
        // System.out.println("Busted MAX value = " + (max + 1)); // creates an OVERFLOW: produces min value

        /* Primitive Data Types
         * int:     occupies 32 bits, width of 32
         * byte:    occupies 8 bits, width of 8
         * short:   occupies 16 bits, width of 16
         * long:    occupies 64 bits, width of 64
         * float:   fractional parts, contain decimals, single precision number (width of 32)
         * double:  fractional parts, contain decimals, double precision number (width of 64)
         * char:    a single character, 16 bits, width of 16 -- allows unicode chars
         * boolean: true or false
         * string:  a grouping of chars
         */

        byte minb = Byte.MIN_VALUE;     // -128
        byte maxb = Byte.MAX_VALUE;     // 127
        // System.out.println(minb);
        // System.out.println(maxb);

        short mins = Short.MIN_VALUE;   // -32768
        short maxs = Short.MAX_VALUE;   // 32767
        // System.out.println(mins);
        // System.out.println(maxs);

        long minl = Long.MIN_VALUE;     // -9223372036854775808
        long maxl = Long.MAX_VALUE;     // 9223372036854775807
        // System.out.println(minl);
        // System.out.println(maxl);

        long longValue = 100L;          // long values should end in 'L' so that the computer knows it is a long

       // CASTING to convert data types

       longValue = (short)(longValue);


       // Primitive Types Challenge

       byte byteVar = 13;
       short shortVar = 12345;
       int intVar = 8675309;
       long longVar = ((byteVar + shortVar + intVar) * 10) + 50000L;
        System.out.println(longVar);

        float floatVar = 5.25f;         // float values should end in 'f'
        double doubleVar = 124.854d;    // double values should end in 'd'
        System.out.println(floatVar + ", " + doubleVar);

        char unicodeVariable = '\u0044';        // prints 'D' according to Unicode Table
        System.out.println(unicodeVariable);
    }
}

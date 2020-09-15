import java.util.ArrayList;

public class MEGAlotto
{
    public static void main( String[] args)
    {
        System.out.println("-._.-._.-._.-._.-._.-.");
    //method
        int[] randomNumbers = new int[6];
    //for loop to put numbers in the array
        for( int i=0; i<randomNumbers.length -1; i++)                           
        { 
        }
   // end
        final int MAX = 70; 
        Integer temp13[] = new Integer[MAX];
        for ( int i = 0; i < MAX; ++i ) {
            temp13[i] = i+1;
        }
        ArrayList< Integer > temp = new java.util.ArrayList< Integer >( java.util.Arrays.asList( temp13 ) );
        int pick5[] = new int[5];
        for ( int i = 0; i < pick5.length; ++i ) {
            int n = (int)(temp.size() * Math.random());
            pick5[i] = temp.get( n );
            temp.remove( n );
        }
        int powerball =( int)( Math.random()*25+1 );
   //for loop to print the numbers
        for( int i=0; i< pick5.length; i++)
        {
            System.out.println( pick5[i] );
        }   
        System.out.println( powerball ); 
        System.out.println("-._.-._.-._.-._.-._.-.");

   // end for

} // end main

}


